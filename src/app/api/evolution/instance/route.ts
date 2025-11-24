import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

const supabase = supabaseAdmin

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY

// Helper para fazer requisições à Evolution API
async function evolutionRequest(endpoint: string, method: string, body?: any) {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        throw new Error('Evolution API configuration missing')
    }

    const url = `${EVOLUTION_API_URL}${endpoint}`
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY
        }
    }

    if (body) {
        options.body = JSON.stringify(body)
    }

    const res = await fetch(url, options)
    const data = await res.json()

    return { ok: res.ok, status: res.status, data }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { faculdade_id, instance_name, action } = body

        console.log('POST /api/evolution/instance - Body received:', { faculdade_id, instance_name, action })

        // Se for ação de sync-chats
        if (action === 'sync-chats') {
            if (!faculdade_id) {
                console.error('Missing faculdade_id in sync-chats request')
                return NextResponse.json({ error: 'Missing faculdade_id' }, { status: 400 })
            }

            const { data: faculdade, error: fetchError } = await supabase
                .from('faculdades')
                .select('evolution_instance')
                .eq('id', faculdade_id)
                .single()

            if (fetchError || !faculdade) {
                console.error('Sync-chats: Faculdade not found or error:', fetchError)
                return NextResponse.json({ error: 'Faculdade not found', details: fetchError }, { status: 404 })
            }

            if (!faculdade.evolution_instance) {
                console.error('Sync-chats: Instance not configured for faculdade:', faculdade_id)
                return NextResponse.json({ error: 'Instance not configured' }, { status: 404 })
            }

            const instanceName = faculdade.evolution_instance
            console.log('Fetching chats for instance:', instanceName)

            // 1. Buscar Chats
            const chatsRes = await evolutionRequest(`/chat/findChats/${instanceName}`, 'GET')

            console.log('Evolution API findChats response:', {
                ok: chatsRes.ok,
                status: chatsRes.status,
                dataType: typeof chatsRes.data,
                dataKeys: chatsRes.data ? Object.keys(chatsRes.data) : null,
                error: chatsRes.data?.error || chatsRes.data?.message
            })

            if (!chatsRes.ok) {
                console.error('Failed to fetch chats:', chatsRes.data)
                return NextResponse.json({
                    error: 'Failed to fetch chats',
                    details: chatsRes.data
                }, { status: chatsRes.status })
            }

            const chats = chatsRes.data || []
            let syncedCount = 0

            for (const chat of chats) {
                // Ignorar grupos se necessário (baseado na config, mas aqui vamos filtrar pelo ID)
                // JID de grupo termina em @g.us, JID de usuário em @s.whatsapp.net
                if (chat.id.includes('@g.us')) continue

                const telefone = chat.id.split('@')[0]

                // Upsert conversa
                const { data: conversa, error: upsertError } = await supabase
                    .from('conversas_whatsapp')
                    .upsert({
                        faculdade_id: faculdade_id,
                        telefone: telefone,
                        nome_cliente: chat.pushName || chat.name || telefone,
                        status: 'ativa',
                        unread_count: chat.unreadCount || 0,
                        ultima_mensagem: '', // Será atualizado ao buscar mensagens
                        updated_at: new Date(chat.conversationTimestamp * 1000).toISOString()
                    }, { onConflict: 'faculdade_id,telefone' })
                    .select()
                    .single()

                if (upsertError || !conversa) {
                    console.error('Erro ao sincronizar conversa:', upsertError)
                    continue
                }

                syncedCount++

                // 2. Buscar Mensagens (opcional: pegar apenas as últimas X)
                // Endpoint: /chat/findMessages/{instance}
                const msgsRes = await evolutionRequest(`/chat/findMessages/${instanceName}`, 'POST', {
                    where: {
                        key: {
                            remoteJid: chat.id
                        }
                    },
                    options: {
                        limit: 20 // Limitar a 20 mensagens iniciais para não sobrecarregar
                    }
                })

                if (msgsRes.ok && msgsRes.data?.messages) {
                    const messages = msgsRes.data.messages
                    let lastMessageContent = ''

                    for (const msg of messages) {
                        const messageData = msg.message || msg
                        const key = msg.key
                        const fromMe = key.fromMe
                        const id = key.id
                        const timestamp = msg.messageTimestamp || msg.pushName // as vezes timestamp vem diferente

                        let content = ''
                        if (messageData.conversation) content = messageData.conversation
                        else if (messageData.extendedTextMessage?.text) content = messageData.extendedTextMessage.text
                        else if (messageData.imageMessage?.caption) content = messageData.imageMessage.caption
                        else if (messageData.videoMessage?.caption) content = messageData.videoMessage.caption
                        else content = '[Mídia]'

                        if (!content) continue
                        lastMessageContent = content

                        await supabase
                            .from('mensagens')
                            .upsert({
                                conversa_id: conversa.id,
                                conteudo: content,
                                tipo: 'texto',
                                remetente: fromMe ? 'agente' : 'cliente',
                                status: fromMe ? 'enviada' : 'recebida',
                                message_id: id,
                                timestamp: new Date((typeof timestamp === 'number' ? timestamp : Date.now() / 1000) * 1000).toISOString()
                            }, { onConflict: 'message_id' })
                    }

                    // Atualizar última mensagem
                    if (lastMessageContent) {
                        await supabase
                            .from('conversas_whatsapp')
                            .update({ ultima_mensagem: lastMessageContent })
                            .eq('id', conversa.id)
                    }
                }
            }

            return NextResponse.json({
                success: true,
                stats: {
                    sincronizados: syncedCount,
                    atualizados: syncedCount
                }
            })
        }

        if (!faculdade_id || !instance_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Criar instância na Evolution API
        // Endpoint: /instance/create
        const createRes = await evolutionRequest('/instance/create', 'POST', {
            instanceName: instance_name,
            qrcode: true, // Já pedir o QR Code
            integration: 'WHATSAPP-BAILEYS',
            reject_call: true,
            groups_ignore: true,
            always_online: true,
            read_messages: true,
            read_status: true
        })

        if (!createRes.ok) {
            // Se já existe, tentamos conectar
            if (createRes.data?.error?.includes('already exists')) {
                // Pular criação
            } else {
                return NextResponse.json({ error: createRes.data?.error || 'Failed to create instance' }, { status: createRes.status })
            }
        }

        // 2. Atualizar no banco de dados
        const { error: dbError } = await supabase
            .from('faculdades')
            .update({
                evolution_instance: instance_name,
                evolution_status: 'created' // Status inicial
            })
            .eq('id', faculdade_id)

        if (dbError) {
            return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
        }

        // 3. Buscar QR Code (se não veio na criação ou para garantir)
        // Endpoint: /instance/connect/{instance}
        const connectRes = await evolutionRequest(`/instance/connect/${instance_name}`, 'GET')

        return NextResponse.json({
            success: true,
            instance: createRes.data,
            qr_code: connectRes.data?.base64 || connectRes.data?.code || null
        })

    } catch (error) {
        console.error('Error in instance route:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const faculdade_id = searchParams.get('faculdade_id')

    if (!faculdade_id) {
        return NextResponse.json({ error: 'Missing faculdade_id' }, { status: 400 })
    }

    try {
        // Buscar nome da instância no banco
        const { data: faculdade, error: dbError } = await supabase
            .from('faculdades')
            .select('evolution_instance')
            .eq('id', faculdade_id)
            .single()

        if (dbError || !faculdade?.evolution_instance) {
            return NextResponse.json({ status: 'nao_configurado' })
        }

        const instanceName = faculdade.evolution_instance

        // Verificar estado da conexão
        // Endpoint: /instance/connectionState/{instance}
        const stateRes = await evolutionRequest(`/instance/connectionState/${instanceName}`, 'GET')

        let status = 'desconectado'
        if (stateRes.ok) {
            const state = stateRes.data?.instance?.state || stateRes.data?.state
            if (state === 'open') status = 'conectado'
            else if (state === 'connecting') status = 'conectando'
            else if (state === 'close') status = 'desconectado'
        }

        // Se não estiver conectado, tentar pegar QR Code
        let qr_code = null
        if (status !== 'conectado') {
            const connectRes = await evolutionRequest(`/instance/connect/${instanceName}`, 'GET')
            qr_code = connectRes.data?.base64 || connectRes.data?.code || null
        }

        // Atualizar status no banco
        await supabase
            .from('faculdades')
            .update({ evolution_status: status })
            .eq('id', faculdade_id)

        return NextResponse.json({ status, qr_code })

    } catch (error) {
        console.error('Error fetching instance status:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const faculdade_id = searchParams.get('faculdade_id')

    if (!faculdade_id) {
        return NextResponse.json({ error: 'Missing faculdade_id' }, { status: 400 })
    }

    try {
        const { data: faculdade } = await supabase
            .from('faculdades')
            .select('evolution_instance')
            .eq('id', faculdade_id)
            .single()

        if (faculdade?.evolution_instance) {
            // Deletar instância na Evolution API
            // Endpoint: /instance/delete/{instance}
            await evolutionRequest(`/instance/delete/${faculdade.evolution_instance}`, 'DELETE')
        }

        // Limpar no banco
        await supabase
            .from('faculdades')
            .update({
                evolution_instance: null,
                evolution_status: 'nao_configurado'
            })
            .eq('id', faculdade_id)

        return NextResponse.json({ success: true })

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    const { searchParams } = new URL(request.url)
    const faculdade_id = searchParams.get('faculdade_id')

    if (!faculdade_id) {
        return NextResponse.json({ error: 'Missing faculdade_id' }, { status: 400 })
    }

    try {
        const { data: faculdade } = await supabase
            .from('faculdades')
            .select('evolution_instance')
            .eq('id', faculdade_id)
            .single()

        if (!faculdade?.evolution_instance) {
            return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
        }

        // Configurar Webhook
        // Endpoint: /webhook/set/{instance}
        // URL do webhook deve ser a URL da nossa aplicação
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const webhookUrl = `${appUrl}/api/webhooks/evolution`

        const webhookRes = await evolutionRequest(`/webhook/set/${faculdade.evolution_instance}`, 'POST', {
            url: webhookUrl,
            webhook_by_events: true,
            webhook_base64: true, // Receber mídia em base64
            events: [
                'MESSAGES_UPSERT',
                'MESSAGES_UPDATE',
                'MESSAGES_DELETE',
                'SEND_MESSAGE',
                'CONNECTION_UPDATE',
                'QRCODE_UPDATED'
            ]
        })

        if (!webhookRes.ok) {
            return NextResponse.json({ error: webhookRes.data?.error || 'Failed to set webhook' }, { status: webhookRes.status })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
