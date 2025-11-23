import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin

/**
 * Buscar configuração global da Evolution API do banco de dados
 */
async function getEvolutionConfig() {
  const { data: configUrl } = await supabase
    .from('configuracoes_globais')
    .select('valor')
    .eq('chave', 'evolution_api_url')
    .single()

  const { data: configKey } = await supabase
    .from('configuracoes_globais')
    .select('valor')
    .eq('chave', 'evolution_api_key')
    .single()

  return {
    apiUrl: configUrl?.valor || process.env.EVOLUTION_API_URL,
    apiKey: configKey?.valor || process.env.EVOLUTION_API_KEY,
  }
}

const syncChatsSchema = z.object({
  faculdade_id: z.string().uuid('ID de faculdade inválido'),
})

/**
 * POST - Sincronizar conversas existentes da Evolution API
 * Rota: /api/evolution/sync-chats
 */
export async function POST(request: NextRequest) {
  console.log('POST /api/evolution/sync-chats - Rota chamada')
  try {
    const body = await request.json()
    console.log('POST /api/evolution/sync-chats - Body recebido:', body)
    const validation = syncChatsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      )
    }

    const { faculdade_id } = validation.data

    // Buscar faculdade e instância
    const { data: faculdade, error: faculdadeError } = await supabase
      .from('faculdades')
      .select('id, evolution_instance, evolution_api_url, evolution_api_key')
      .eq('id', faculdade_id)
      .single()

    if (faculdadeError || !faculdade) {
      return NextResponse.json(
        { error: 'Faculdade não encontrada' },
        { status: 404 }
      )
    }

    if (!faculdade.evolution_instance) {
      return NextResponse.json(
        { error: 'Instância Evolution não configurada para esta faculdade' },
        { status: 400 }
      )
    }

    // Buscar configuração da Evolution API
    const config = await getEvolutionConfig()
    const apiUrl = faculdade.evolution_api_url || config.apiUrl
    const apiKey = faculdade.evolution_api_key || config.apiKey

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Configuração da Evolution API não encontrada' },
        { status: 500 }
      )
    }

    const instanceName = faculdade.evolution_instance

    // Buscar chats da Evolution API
    console.log(`Sincronizando chats da instância: ${instanceName}`)
    
    // Tentar diferentes endpoints da Evolution API
    let chatsResponse
    let chats: any = null
    
    // Tentar endpoint /chat/fetchChats/{instance}
    try {
      chatsResponse = await fetch(`${apiUrl}/chat/fetchChats/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        },
      })

      if (chatsResponse.ok) {
        chats = await chatsResponse.json()
      }
    } catch (error) {
      console.warn('Erro ao tentar fetchChats:', error)
    }

    // Se não funcionou, tentar /chat/all/{instance}
    if (!chats || !chatsResponse?.ok) {
      try {
        chatsResponse = await fetch(`${apiUrl}/chat/all/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json',
          },
        })

        if (chatsResponse.ok) {
          chats = await chatsResponse.json()
        }
      } catch (error) {
        console.warn('Erro ao tentar chat/all:', error)
      }
    }

    if (!chats || !chatsResponse?.ok) {
      const errorText = chatsResponse ? await chatsResponse.text() : 'Erro ao conectar com a API'
      console.error('Erro ao buscar chats:', errorText)
      return NextResponse.json(
        { error: `Erro ao buscar chats: ${chatsResponse?.statusText || 'Falha na conexão'}` },
        { status: chatsResponse?.status || 500 }
      )
    }

    console.log(`Encontrados ${Array.isArray(chats) ? chats.length : Object.keys(chats || {}).length} chats`)

    // Processar chats
    const chatsArray = Array.isArray(chats) ? chats : Object.values(chats || {})
    let sincronizados = 0
    let atualizados = 0
    let erros = 0

    for (const chat of chatsArray) {
      try {
        // Extrair informações do chat
        const chatData = chat.chat || chat
        const jid = chatData.id || chatData.jid || chat.id || chat.jid
        if (!jid) continue

        // Remover @s.whatsapp.net se presente
        const telefone = jid.replace('@s.whatsapp.net', '').replace('@g.us', '')
        const nome = chatData.name || chatData.subject || chatData.pushName || telefone
        const unreadCount = chatData.unreadCount || chat.unreadCount || 0

        // Buscar última mensagem do chat
        let ultimaMensagem = ''
        let dataUltimaMensagem = new Date().toISOString()

        // Tentar buscar mensagens do chat
        try {
          // Tentar diferentes formatos de endpoint
          let messagesResponse
          
          // Formato 1: /message/fetchMessages/{instance}
          try {
            const queryParams = new URLSearchParams({
              where: JSON.stringify({ key: { remoteJid: jid } }),
              limit: '1'
            })
            messagesResponse = await fetch(
              `${apiUrl}/message/fetchMessages/${instanceName}?${queryParams}`,
              {
                method: 'GET',
                headers: {
                  'apikey': apiKey,
                  'Content-Type': 'application/json',
                },
              }
            )
          } catch (e) {
            // Formato 2: /chat/fetchMessages/{instance}
            try {
              messagesResponse = await fetch(
                `${apiUrl}/chat/fetchMessages/${instanceName}?where={"key":{"remoteJid":"${jid}"}}&limit=1`,
                {
                  method: 'GET',
                  headers: {
                    'apikey': apiKey,
                    'Content-Type': 'application/json',
                  },
                }
              )
            } catch (e2) {
              // Se ambos falharem, usar dados do próprio chat
              if (chatData.lastMessage) {
                ultimaMensagem = extractMessageContent({ message: chatData.lastMessage }) || ''
              }
              if (chatData.lastMessageTimestamp) {
                dataUltimaMensagem = new Date(chatData.lastMessageTimestamp * 1000).toISOString()
              }
            }
          }

          if (messagesResponse?.ok) {
            const messages = await messagesResponse.json()
            const messagesArray = Array.isArray(messages) ? messages : Object.values(messages || {})
            
            if (messagesArray.length > 0) {
              const lastMessage = messagesArray[0]
              ultimaMensagem = extractMessageContent(lastMessage) || ''
              
              if (lastMessage.messageTimestamp) {
                dataUltimaMensagem = new Date(lastMessage.messageTimestamp * 1000).toISOString()
              }
            }
          } else if (chatData.lastMessage) {
            // Usar dados do próprio chat se não conseguir buscar mensagens
            ultimaMensagem = extractMessageContent({ message: chatData.lastMessage }) || ''
            if (chatData.lastMessageTimestamp) {
              dataUltimaMensagem = new Date(chatData.lastMessageTimestamp * 1000).toISOString()
            }
          }
        } catch (msgError) {
          console.warn(`Erro ao buscar mensagens do chat ${jid}:`, msgError)
          // Tentar usar dados do chat se disponível
          if (chatData.lastMessage) {
            ultimaMensagem = extractMessageContent({ message: chatData.lastMessage }) || ''
          }
        }

        // Verificar se conversa já existe
        const { data: conversaExistente } = await supabase
          .from('conversas_whatsapp')
          .select('id')
          .eq('telefone', telefone)
          .eq('faculdade_id', faculdade_id)
          .maybeSingle()

        if (conversaExistente) {
          // Atualizar conversa existente
          const { error: updateError } = await supabase
            .from('conversas_whatsapp')
            .update({
              nome: nome,
              ultima_mensagem: ultimaMensagem || null,
              data_ultima_mensagem: dataUltimaMensagem,
              nao_lidas: unreadCount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversaExistente.id)

          if (updateError) {
            console.error(`Erro ao atualizar conversa ${conversaExistente.id}:`, updateError)
            erros++
          } else {
            atualizados++
          }
        } else {
          // Criar nova conversa
          const { error: insertError } = await supabase
            .from('conversas_whatsapp')
            .insert({
              faculdade_id: faculdade_id,
              telefone: telefone,
              nome: nome,
              status: 'ativo',
              status_conversa: 'ativa',
              ultima_mensagem: ultimaMensagem || null,
              data_ultima_mensagem: dataUltimaMensagem,
              nao_lidas: unreadCount,
              departamento: 'WhatsApp',
              setor: 'Atendimento',
            })

          if (insertError) {
            console.error(`Erro ao criar conversa para ${telefone}:`, insertError)
            erros++
          } else {
            sincronizados++
          }
        }
      } catch (chatError: any) {
        console.error('Erro ao processar chat:', chatError)
        erros++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída',
      stats: {
        total: chatsArray.length,
        sincronizados,
        atualizados,
        erros,
      },
    })
  } catch (error: any) {
    console.error('Erro ao sincronizar chats:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao sincronizar chats' },
      { status: 500 }
    )
  }
}

/**
 * Helper para extrair conteúdo da mensagem
 */
function extractMessageContent(message: any): string {
  if (!message || !message.message) return ''

  const msg = message.message
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    (msg.imageMessage ? '📷 Imagem' : '') ||
    (msg.videoMessage ? '🎥 Vídeo' : '') ||
    (msg.documentMessage ? '📄 Documento' : '') ||
    (msg.audioMessage ? '🎵 Áudio' : '') ||
    ''
  )
}

