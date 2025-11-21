import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { conversa_id, content, type } = body

        if (!conversa_id || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Buscar detalhes da conversa e da instância
        const { data: conversa, error: conversaError } = await supabase
            .from('conversas_whatsapp')
            .select(`
        *,
        faculdade:faculdades (
          evolution_instance
        )
      `)
            .eq('id', conversa_id)
            .single()

        if (conversaError || !conversa || !conversa.faculdade?.evolution_instance) {
            return NextResponse.json({ error: 'Conversation or instance not found' }, { status: 404 })
        }

        const instanceName = conversa.faculdade.evolution_instance
        const remoteJid = `${conversa.telefone}@s.whatsapp.net` // Formatar JID

        // 2. Enviar para Evolution API
        // Endpoint: /message/sendText/{instance}
        const url = `${EVOLUTION_API_URL}/message/sendText/${instanceName}`

        const payload = {
            number: conversa.telefone, // Evolution API aceita número sem sufixo também, mas o endpoint pede 'number'
            textMessage: {
                text: content
            },
            options: {
                presence: 'composing', // Simular digitando
                delay: 1000 // Pequeno delay natural
            }
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY!
            },
            body: JSON.stringify(payload)
        })

        const data = await res.json()

        if (!res.ok) {
            return NextResponse.json({ error: data.error || 'Failed to send message' }, { status: res.status })
        }

        // 3. Salvar mensagem no banco (Otimista ou confirmar com resposta da API)
        // A API retorna a mensagem criada. Podemos usar o ID dela.
        const messageId = data.key?.id || data.id

        const { error: dbError } = await supabase
            .from('mensagens')
            .insert({
                conversa_id: conversa_id,
                conteudo: content,
                tipo_mensagem: type || 'texto',
                remetente: 'agente', // ou 'humano'
                lida: true,
                // message_id: messageId, // Campo não existe na definição de tipos atual
                timestamp: new Date().toISOString()
            })

        if (dbError) {
            console.error('Error saving sent message:', dbError)
            // Não falhar a request se enviou no zap mas falhou no banco (embora seja ruim)
        }

        // Atualizar última mensagem da conversa
        await supabase
            .from('conversas_whatsapp')
            .update({
                ultima_mensagem: content,
                updated_at: new Date().toISOString()
            })
            .eq('id', conversa_id)

        return NextResponse.json({ success: true, message: data })

    } catch (error) {
        console.error('Error sending message:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
