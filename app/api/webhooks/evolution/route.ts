import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Evolution API envia o tipo do evento no campo 'type' ou 'event'
        const eventType = body.type || body.event
        const instance = body.instance || body.instanceName
        const data = body.data

        if (!eventType) {
            return NextResponse.json({ error: 'Tipo de evento não identificado' }, { status: 400 })
        }

        // Log para debug
        if (process.env.NODE_ENV === 'development') {
            console.log(`Webhook Evolution [${eventType}] - Instância: ${instance}`)
        }

        switch (eventType) {
            case 'MESSAGES_UPSERT':
                await handleMessageUpsert(data, instance)
                break
            case 'MESSAGES_UPDATE':
                await handleMessageUpdate(data, instance)
                break
            case 'CONNECTION_UPDATE':
                await handleConnectionUpdate(data, instance)
                break
            case 'QRCODE_UPDATED':
                // Pode ser útil para atualizar o QR code no frontend em tempo real
                break
            default:
                // Ignorar outros eventos
                break
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Erro ao processar webhook Evolution:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

async function handleConnectionUpdate(data: any, instance: string) {
    if (!instance) return

    const status = data.status || data.state
    // Mapear status do Evolution para status do sistema
    // Evolution: open, close, connecting, refuses
    // Sistema: conectado, desconectado, conectando

    let systemStatus = 'desconectado'
    if (status === 'open' || status === 'connected') systemStatus = 'conectado'
    else if (status === 'connecting') systemStatus = 'conectando'

    // Atualizar status na tabela faculdades
    const { error } = await supabase
        .from('faculdades')
        .update({ evolution_status: systemStatus })
        .eq('evolution_instance', instance)

    if (error) {
        console.error(`Erro ao atualizar status da instância ${instance}:`, error)
    }
}

async function handleMessageUpsert(data: any, instance: string) {
    if (!data || !data.key) return

    // Ignorar mensagens enviadas pela própria instância (fromMe)
    if (data.key.fromMe) return

    const remoteJid = data.key.remoteJid
    if (!remoteJid) return

    const phoneNumber = remoteJid.replace('@s.whatsapp.net', '')

    // Extrair conteúdo da mensagem
    const messageContent = extractMessageContent(data)
    if (!messageContent) return // Mensagem vazia ou tipo não suportado

    const messageType = getMessageType(data)

    // 1. Identificar Faculdade
    const { data: faculdade } = await supabase
        .from('faculdades')
        .select('id')
        .eq('evolution_instance', instance)
        .single()

    if (!faculdade) {
        console.warn(`Faculdade não encontrada para instância: ${instance}`)
        return
    }

    // 2. Buscar ou Criar Conversa
    let { data: conversa } = await supabase
        .from('conversas_whatsapp')
        .select('id')
        .eq('telefone', phoneNumber)
        .eq('faculdade_id', faculdade.id)
        .maybeSingle()

    if (!conversa) {
        // Criar nova conversa
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
                nao_lidas: 1,
                departamento: 'WhatsApp', // Default
                setor: 'Atendimento', // Default
            })
            .select()
            .single()

        if (error) {
            console.error('Erro ao criar conversa:', error)
            return
        }
        conversa = novaConversa
    } else {
        // Atualizar conversa existente
        await supabase
            .from('conversas_whatsapp')
            .update({
                ultima_mensagem: messageContent,
                data_ultima_mensagem: new Date().toISOString(),
                // Incrementar não lidas (precisa de uma query raw ou lógica de leitura prévia, aqui simplificado)
                // Como não temos acesso fácil ao valor atual sem ler, vamos assumir que o frontend lida ou usamos rpc se necessário.
                // Por enquanto, apenas atualizamos o timestamp e mensagem.
                // Para incrementar, idealmente usaríamos uma function RPC ou leríamos o valor atual.
                // Vamos ler o valor atual rapidinho se já não tivermos.
                // (Otimização futura: usar RPC 'increment_unread')
            })
            .eq('id', conversa.id)

        // Incremento de não lidas separado para garantir atomicidade se possível, ou simples update
        const { data: current } = await supabase.from('conversas_whatsapp').select('nao_lidas').eq('id', conversa.id).single()
        const newCount = (current?.nao_lidas || 0) + 1
        await supabase.from('conversas_whatsapp').update({ nao_lidas: newCount }).eq('id', conversa.id)
    }

    // 3. Inserir Mensagem
    const { error: msgError } = await supabase
        .from('mensagens')
        .insert({
            conversa_id: conversa.id,
            conteudo: messageContent,
            remetente: 'cliente',
            tipo_mensagem: messageType,
            timestamp: new Date(data.messageTimestamp * 1000).toISOString(),
            lida: false,
            message_id: data.key.id
        })

    if (msgError) {
        console.error('Erro ao inserir mensagem:', msgError)
    }
}

async function handleMessageUpdate(data: any, instance: string) {
    // Atualização de status de mensagem (Lida, Entregue)
    // data.status: 'READ', 'DELIVERED', etc.
    // data.key.id: ID da mensagem

    if (!data.key?.id || !data.status) return

    if (data.status === 'READ') {
        // Marcar mensagem como lida no banco
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
