import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Inicializar cliente Supabase com chave de serviço para ignorar RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
    try {
        const payload = await request.json()

        // Verificar se é um evento de mensagem
        const { type, data, instance } = payload

        console.log('Webhook received:', { type, instance, dataKeys: Object.keys(data || {}) })

        // Evolution API v2 geralmente envia type: 'messages.upsert'
        if (type !== 'messages.upsert' && type !== 'message') {
            return NextResponse.json({ message: 'Ignored event type' }, { status: 200 })
        }

        const messageData = data.message || data
        const key = data.key || messageData.key

        if (!key) {
            return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 })
        }

        const remoteJid = key.remoteJid
        const fromMe = key.fromMe
        const id = key.id
        const pushName = data.pushName || messageData.pushName

        // Extrair conteúdo e tipo da mensagem
        let content = ''
        let messageType: 'texto' | 'imagem' | 'video' | 'audio' | 'documento' = 'texto'
        let mediaUrl = ''

        const messageContent = messageData.message || messageData

        if (messageContent?.conversation) {
            content = messageContent.conversation
            messageType = 'texto'
        } else if (messageContent?.extendedTextMessage?.text) {
            content = messageContent.extendedTextMessage.text
            messageType = 'texto'
        } else if (messageContent?.imageMessage) {
            content = messageContent.imageMessage.caption || 'Imagem'
            messageType = 'imagem'
            // Tentar pegar URL se disponível (Evolution pode enviar base64 ou url dependendo da config)
            // Se vier base64, idealmente faríamos upload para storage, mas por enquanto vamos ver se tem url
            mediaUrl = messageContent.imageMessage.url || ''
        } else if (messageContent?.videoMessage) {
            content = messageContent.videoMessage.caption || 'Vídeo'
            messageType = 'video'
            mediaUrl = messageContent.videoMessage.url || ''
        } else if (messageContent?.audioMessage) {
            content = 'Áudio'
            messageType = 'audio'
            mediaUrl = messageContent.audioMessage.url || ''
        } else if (messageContent?.documentMessage) {
            content = messageContent.documentMessage.fileName || 'Documento'
            messageType = 'documento'
            mediaUrl = messageContent.documentMessage.url || ''
        } else if (messageContent?.stickerMessage) {
            content = 'Figurinha'
            messageType = 'imagem' // Mapeando sticker para imagem por enquanto
            mediaUrl = messageContent.stickerMessage.url || ''
        } else {
            content = '[Mídia ou formato não suportado]'
            messageType = 'texto'
        }

        // Identificar a faculdade pela instância
        const { data: faculdade, error: faculdadeError } = await supabase
            .from('faculdades')
            .select('id')
            .eq('evolution_instance', instance)
            .single()

        if (faculdadeError || !faculdade) {
            console.error('Faculdade não encontrada para instância:', instance)
            return NextResponse.json({ error: 'Faculdade not found' }, { status: 404 })
        }

        // Extrair telefone (remover @s.whatsapp.net)
        const telefone = remoteJid.split('@')[0]

        // Buscar ou criar conversa
        let { data: conversa, error: conversaError } = await supabase
            .from('conversas_whatsapp')
            .select('id, nao_lidas')
            .eq('faculdade_id', faculdade.id)
            .eq('telefone', telefone)
            .single()

        if (!conversa) {
            // Criar nova conversa
            const { data: newConversa, error: createError } = await supabase
                .from('conversas_whatsapp')
                .insert({
                    faculdade_id: faculdade.id,
                    telefone: telefone,
                    nome: pushName || telefone, // Corrigido: nome_cliente -> nome
                    status: 'ativa',
                    nao_lidas: fromMe ? 0 : 1, // Corrigido: unread_count -> nao_lidas
                    ultima_mensagem: content,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (createError) {
                console.error('Erro ao criar conversa:', createError)
                return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
            }
            conversa = newConversa
        } else {
            // Atualizar conversa existente
            const { error: updateError } = await supabase
                .from('conversas_whatsapp')
                .update({
                    ultima_mensagem: content,
                    nao_lidas: fromMe ? 0 : (conversa.nao_lidas || 0) + 1, // Corrigido: unread_count -> nao_lidas
                    updated_at: new Date().toISOString(),
                    // Atualizar nome se disponível e não for o próprio atendente
                    ...(pushName && !fromMe ? { nome: pushName } : {}) // Corrigido: nome_cliente -> nome
                })
                .eq('id', conversa.id)

            if (updateError) {
                console.error('Erro ao atualizar conversa:', updateError)
            }
        }

        if (!conversa) {
            return NextResponse.json({ error: 'Conversation not found or created' }, { status: 500 })
        }

        // Inserir mensagem
        const { error: messageError } = await supabase
            .from('mensagens')
            .insert({
                conversa_id: conversa.id,
                conteudo: content,
                tipo_mensagem: messageType, // Corrigido: tipo -> tipo_mensagem
                midia_url: mediaUrl, // Adicionado campo midia_url
                remetente: fromMe ? 'agente' : 'usuario', // Corrigido: cliente -> usuario (conforme enum)
                lida: fromMe ? true : false, // Corrigido: status -> lida boolean
                // message_id: id, // Campo não existe na interface Mensagem, removido
                timestamp: new Date().toISOString()
            })

        if (messageError) {
            console.error('Erro ao inserir mensagem:', messageError)
            return NextResponse.json({ error: 'Failed to insert message' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Erro no webhook:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
