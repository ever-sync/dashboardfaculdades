import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        console.error('=== WEBHOOK EVOLUTION RECEBIDO ===')
        console.error('Body completo:', JSON.stringify(body, null, 2))

        // Evolution API envia o tipo do evento no campo 'type' ou 'event'
        const eventType = body.type || body.event
        const instance = body.instance || body.instanceName
        const data = body.data

        console.log('Event Type:', eventType)
        console.log('Instance:', instance)
        console.log('Data:', data ? 'Presente' : 'Ausente')

        if (!eventType) {
            console.error('❌ Tipo de evento não identificado')
            return NextResponse.json({ error: 'Tipo de evento não identificado' }, { status: 400 })
        }

        switch (eventType) {
            case 'MESSAGES_UPSERT':
                console.log('📩 Processando MESSAGES_UPSERT...')
                await handleMessageUpsert(data, instance)
                break
            case 'MESSAGES_UPDATE':
                console.log('🔄 Processando MESSAGES_UPDATE...')
                await handleMessageUpdate(data, instance)
                break
            case 'CONNECTION_UPDATE':
                console.log('🔌 Processando CONNECTION_UPDATE...')
                await handleConnectionUpdate(data, instance)
                break
            case 'QRCODE_UPDATED':
                console.log('📱 QR Code atualizado')
                break
            default:
                console.log('⚠️ Evento ignorado:', eventType)
                break
        }

        console.log('✅ Webhook processado com sucesso')
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('❌ Erro ao processar webhook Evolution:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

async function handleConnectionUpdate(data: any, instance: string) {
    if (!instance) return

    const status = data.status || data.state
    let systemStatus = 'desconectado'
    if (status === 'open' || status === 'connected') systemStatus = 'conectado'
    else if (status === 'connecting') systemStatus = 'conectando'

    const { error } = await supabase
        .from('faculdades')
        .update({ evolution_status: systemStatus })
        .eq('evolution_instance', instance)

    if (error) {
        console.error(`Erro ao atualizar status da instância ${instance}:`, error)
    }
}

async function handleMessageUpsert(data: any, instance: string) {
    console.log('🔍 handleMessageUpsert - Início')
    console.log('Data recebido:', JSON.stringify(data, null, 2))
    console.log('Instance:', instance)

    if (!data || !data.key) {
        console.error('❌ Data ou key ausente')
        return
    }

    const remoteJid = data.key.remoteJid
    if (!remoteJid) {
        console.error('❌ remoteJid ausente')
        return
    }

    const phoneNumber = remoteJid.replace('@s.whatsapp.net', '')
    const fromMe = data.key.fromMe || false

    console.log('📱 Telefone:', phoneNumber)
    console.log('👤 FromMe:', fromMe)

    const messageContent = extractMessageContent(data)
    if (!messageContent) {
        console.error('❌ Conteúdo da mensagem vazio')
        return
    }

    console.log('💬 Conteúdo:', messageContent)

    const messageType = getMessageType(data)
    console.log('📝 Tipo:', messageType)

    // 1. Identificar Faculdade
    console.log('🔍 Buscando faculdade para instância:', instance)
    const { data: faculdade, error: faculdadeError } = await supabase
        .from('faculdades')
        .select('id')
        .eq('evolution_instance', instance)
        .single()

    if (faculdadeError) {
        console.error('❌ Erro ao buscar faculdade:', faculdadeError)
    }

    if (!faculdade) {
        console.error(`❌ Faculdade não encontrada para instância: ${instance}`)
        return
    }

    console.log('✅ Faculdade encontrada:', faculdade.id)

    // 2. Buscar ou Criar Conversa
    console.log('🔍 Buscando conversa existente...')
    let { data: conversa, error: conversaError } = await supabase
        .from('conversas_whatsapp')
        .select('id, nao_lidas')
        .eq('telefone', phoneNumber)
        .eq('faculdade_id', faculdade.id)
        .maybeSingle()

    if (conversaError) {
        console.error('❌ Erro ao buscar conversa:', conversaError)
    }

    if (!conversa) {
        console.log('➕ Criando nova conversa...')
        const { data: novaConversa, error } = await supabase
            .from('conversas_whatsapp')
            .insert({
                faculdade_id: faculdade.id,
                telefone: phoneNumber,
                nome: data.pushName || phoneNumber,
                status: 'ativo',
                status_conversa: 'ativa',
                ultima_mensagem: messageContent,
                data_ultima_mensagem: new Date().toISOString(),
                nao_lidas: fromMe ? 0 : 1,
                departamento: 'WhatsApp',
                setor: 'Atendimento',
            })
            .select()
            .single()

        if (error) {
            console.error('❌ Erro ao criar conversa:', error)
            return
        }
        conversa = novaConversa
        if (conversa) {
            console.log('✅ Conversa criada:', conversa.id)
        }
    } else {
        console.log('✅ Conversa encontrada:', conversa.id)
        console.log('🔄 Atualizando conversa...')
        const newUnreadCount = fromMe ? 0 : (conversa.nao_lidas || 0) + 1

        const { error: updateError } = await supabase
            .from('conversas_whatsapp')
            .update({
                ultima_mensagem: messageContent,
                data_ultima_mensagem: new Date().toISOString(),
                nao_lidas: newUnreadCount,
                updated_at: new Date().toISOString(),
            })
            .eq('id', conversa.id)

        if (updateError) {
            console.error('❌ Erro ao atualizar conversa:', updateError)
        } else {
            console.log('✅ Conversa atualizada')
        }
    }

    if (!conversa) {
        console.error('❌ Erro: conversa não foi criada/encontrada')
        return
    }

    // 3. Inserir Mensagem
    console.log('💾 Inserindo mensagem no banco...')
    const { error: msgError } = await supabase
        .from('mensagens')
        .insert({
            conversa_id: conversa.id,
            conteudo: messageContent,
            remetente: fromMe ? 'agente' : 'usuario',
            tipo_mensagem: messageType,
            timestamp: new Date(data.messageTimestamp * 1000).toISOString(),
            lida: fromMe ? true : false,
            message_id: data.key.id
        })

    if (msgError) {
        console.error('❌ Erro ao inserir mensagem:', msgError)
    } else {
        console.log('✅ Mensagem inserida com sucesso!')
    }
}

async function handleMessageUpdate(data: any, instance: string) {
    if (!data.key?.id || !data.status) return

    if (data.status === 'READ') {
        await supabase
            .from('mensagens')
            .update({ lida: true })
            .eq('message_id', data.key.id)
    }
}

// Helpers
function extractMessageContent(data: any): string {
    const msg = data.message
    if (!msg) return ''

    return (
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        msg.documentMessage?.caption ||
        (msg.imageMessage ? 'Imagem' : '') ||
        (msg.videoMessage ? 'Vídeo' : '') ||
        (msg.documentMessage ? 'Documento' : '') ||
        (msg.audioMessage ? 'Áudio' : '') ||
        ''
    )
}

function getMessageType(data: any): 'texto' | 'imagem' | 'documento' | 'audio' | 'video' {
    const msg = data.message
    if (!msg) return 'texto'

    if (msg.imageMessage) return 'imagem'
    if (msg.videoMessage) return 'video'
    if (msg.documentMessage) return 'documento'
    if (msg.audioMessage) return 'audio'

    return 'texto'
}
