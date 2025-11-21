import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Buscar configuração global da Evolution API do banco de dados
 * Fallback para variáveis de ambiente se não estiver no banco
 */
async function getEvolutionConfig() {
  // Tentar buscar do banco primeiro
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

  // Usar do banco se disponível, senão usar variáveis de ambiente
  return {
    apiUrl: configUrl?.valor || process.env.EVOLUTION_API_URL,
    apiKey: configKey?.valor || process.env.EVOLUTION_API_KEY,
  }
}

// Schema de validação
const createInstanceSchema = z.object({
  faculdade_id: z.string().uuid('ID de faculdade inválido'),
  instance_name: z.string().min(1, 'Nome da instância é obrigatório').max(100, 'Nome muito longo'),
})

/**
 * GET - Buscar informações da instância e QR code
 */
export async function GET(request: NextRequest) {
  try {
    // Tentar múltiplas formas de ler os parâmetros (para garantir compatibilidade)
    const nextUrlSearchParams = request.nextUrl.searchParams
    const urlFromRequest = new URL(request.url)
    const urlSearchParams = urlFromRequest.searchParams

    // Tentar obter faculdade_id de ambas as fontes
    const faculdadeId = nextUrlSearchParams.get('faculdade_id') || urlSearchParams.get('faculdade_id')

    // Log detalhado (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('GET /api/evolution/instance - Request details:', {
        request_url: request.url,
        nextUrl_pathname: request.nextUrl.pathname,
        nextUrl_search: request.nextUrl.search,
        nextUrl_href: request.nextUrl.href,
        nextUrl_searchParams_keys: Array.from(nextUrlSearchParams.keys()),
        nextUrl_searchParams_all: Object.fromEntries(nextUrlSearchParams.entries()),
        url_searchParams_keys: Array.from(urlSearchParams.keys()),
        url_searchParams_all: Object.fromEntries(urlSearchParams.entries()),
        faculdade_id_from_nextUrl: nextUrlSearchParams.get('faculdade_id'),
        faculdade_id_from_url: urlSearchParams.get('faculdade_id'),
        faculdade_id_final: faculdadeId,
      })
    }

    if (!faculdadeId) {
      // Log do erro
      if (process.env.NODE_ENV === 'development') {
        console.error('GET /api/evolution/instance - faculdade_id não encontrado:', {
          request_url: request.url,
          nextUrl_href: request.nextUrl.href,
          nextUrl_search: request.nextUrl.search,
          nextUrl_params: Object.fromEntries(nextUrlSearchParams.entries()),
          url_params: Object.fromEntries(urlSearchParams.entries())
        })
      }

      return NextResponse.json(
        {
          error: 'faculdade_id é obrigatório',
          details: `É necessário fornecer o ID da faculdade para buscar ou gerenciar a instância Evolution. URL recebida: ${request.nextUrl.href}`,
          solution: 'Certifique-se de que o parâmetro faculdade_id está sendo enviado na requisição.',
          debug: process.env.NODE_ENV === 'development' ? {
            request_url: request.url,
            nextUrl_href: request.nextUrl.href,
            nextUrl_search: request.nextUrl.search,
            nextUrl_params: Object.fromEntries(nextUrlSearchParams.entries()),
            url_params: Object.fromEntries(urlSearchParams.entries())
          } : undefined
        },
        { status: 400 }
      )
    }

    console.log('Buscando faculdade com ID:', faculdadeId)

    // Buscar faculdade
    const { data: faculdade, error: faculdadeError } = await supabase
      .from('faculdades')
      .select('id, nome, evolution_instance, evolution_status, evolution_qr_code, evolution_qr_expires_at, evolution_connected_at, evolution_last_error')
      .eq('id', faculdadeId)
      .single()

    if (faculdadeError) {
      console.error('Erro ao buscar faculdade:', faculdadeError)
    }

    if (!faculdade) {
      console.warn('Faculdade não encontrada no banco de dados.')
    }

    if (faculdadeError || !faculdade) {
      return NextResponse.json(
        { error: 'Faculdade não encontrada' },
        { status: 404 }
      )
    }

    // Se não tem instância configurada, retornar apenas dados da faculdade
    if (!faculdade.evolution_instance) {
      return NextResponse.json({
        faculdade_id: faculdade.id,
        instance_name: null,
        status: 'nao_configurado',
        qr_code: null,
        qr_expires_at: null,
        connected_at: null,
        last_error: null,
      })
    }

    // Buscar configuração global (banco de dados ou variáveis de ambiente)
    const config = await getEvolutionConfig()
    const apiUrl = config.apiUrl
    const apiKey = config.apiKey

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Evolution API não configurada. Configure no banco de dados (tabela configuracoes_globais) ou nas variáveis de ambiente EVOLUTION_API_URL e EVOLUTION_API_KEY.' },
        { status: 500 }
      )
    }

    // Buscar QR code e status da instância
    let qrCode = faculdade.evolution_qr_code
    let qrExpiresAt = faculdade.evolution_qr_expires_at
    let status = faculdade.evolution_status || 'desconectado'
    let connectedAt = faculdade.evolution_connected_at

    // Verificar se QR code expirou
    if (qrExpiresAt && new Date(qrExpiresAt) < new Date()) {
      qrCode = null
      qrExpiresAt = null
    }

    // Se não tem QR code ou expirou, buscar novo
    if (!qrCode || !qrExpiresAt) {
      try {
        const connectUrl = `${apiUrl}/instance/connect/${faculdade.evolution_instance}`
        console.log('Buscando QR Code em:', connectUrl)

        const qrResponse = await fetch(connectUrl, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
          },
        })

        console.log('Status da resposta do QR Code:', qrResponse.status)

        if (qrResponse.ok) {
          const qrData = await qrResponse.json()
          console.log('Dados do QR Code recebidos:', JSON.stringify(qrData, null, 2))

          // Evolution API v2 retorna o QR code no campo 'code' como data:image/png;base64,...
          if (qrData.code) {
            // Extrair apenas a parte base64 se vier como data URI
            const base64Match = qrData.code.match(/^data:image\/png;base64,(.+)$/)
            qrCode = base64Match ? base64Match[1] : qrData.code

            // QR code geralmente expira em 40 segundos
            qrExpiresAt = new Date(Date.now() + 40 * 1000).toISOString()

            console.log('QR Code extraído com sucesso, tamanho:', qrCode.length)

            // Atualizar no banco
            await supabase
              .from('faculdades')
              .update({
                evolution_qr_code: qrCode,
                evolution_qr_expires_at: qrExpiresAt,
                evolution_status: 'conectando',
              })
              .eq('id', faculdadeId)
          } else {
            console.warn('Campo code não encontrado na resposta:', qrData)
          }
        } else {
          const errorText = await qrResponse.text()
          console.warn('Erro ao buscar QR Code (resposta não ok):', errorText)
        }
      } catch (error) {
        console.warn('Erro ao buscar QR code (exceção):', error)
      }
    }

    // Verificar status da instância
    try {
      console.log('Verificando status da instância:', faculdade.evolution_instance)
      const statusResponse = await fetch(`${apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
      })

      console.log('Status response code:', statusResponse.status)

      if (statusResponse.ok) {
        const instances = await statusResponse.json()
        console.log('Full instances response:', JSON.stringify(instances, null, 2))

        // Evolution API can return different formats:
        // 1. Array of instances: [{ instance: { instanceName, state } }]
        // 2. Object with instance names as keys: { "instanceName": { instance: { ... } } }
        let instance = null

        if (Array.isArray(instances)) {
          console.log('Response is array, searching...')
          instance = instances.find((inst: any) => {
            // Evolution API v2 returns: { name: "instanceName", connectionStatus: "open", ... }
            const name = inst.name || inst.instance?.instanceName || inst.instanceName
            console.log('Checking instance:', name, 'against', faculdade.evolution_instance)
            return name === faculdade.evolution_instance
          })
        } else if (typeof instances === 'object') {
          console.log('Response is object, looking up by key...')
          instance = instances[faculdade.evolution_instance]
        }

        console.log('Instância encontrada:', instance ? 'Sim' : 'Não')
        console.log('Estrutura completa da instância:', JSON.stringify(instance, null, 2))

        if (instance) {
          // Evolution API v2 uses 'connectionStatus' field
          const instanceStatus = instance.connectionStatus || instance.instance?.status || instance.status
          console.log('Status extraído:', instanceStatus)
          console.log('Status será mapeado para:', instanceStatus === 'open' ? 'conectado' : 'desconectado')

          status = instanceStatus === 'open' ? 'conectado' : 'desconectado'

          if (status === 'conectado' && !connectedAt) {
            connectedAt = new Date().toISOString()
          }

          console.log('Atualizando banco com status:', status)

          // Atualizar status no banco
          const updateResult = await supabase
            .from('faculdades')
            .update({
              evolution_status: status,
              evolution_connected_at: status === 'conectado' ? connectedAt : faculdade.evolution_connected_at,
            })
            .eq('id', faculdadeId)

          console.log('Resultado da atualização:', updateResult)
        }
      } else {
        console.warn('Erro ao buscar status (response not ok):', await statusResponse.text())
      }
    } catch (error) {
      console.warn('Erro ao verificar status:', error)
    }

    return NextResponse.json({
      faculdade_id: faculdade.id,
      instance_name: faculdade.evolution_instance,
      status,
      qr_code: qrCode,
      qr_expires_at: qrExpiresAt,
      connected_at: connectedAt || faculdade.evolution_connected_at,
      last_error: faculdade.evolution_last_error,
    })
  } catch (error) {
    console.error('Erro ao buscar instância:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error) },
      { status: 500 }
    )
  }
}

/**
 * POST - Criar ou atualizar instância Evolution
 */
export async function POST(request: NextRequest) {
  try {
    let body: any = {}

    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Erro ao fazer parse do body:', parseError)
      return NextResponse.json(
        { error: 'Body da requisição inválido. Esperado JSON válido.' },
        { status: 400 }
      )
    }

    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('POST /api/evolution/instance - Body recebido:', {
        faculdade_id: body.faculdade_id,
        instance_name: body.instance_name,
        action: body.action,
        tipo_faculdade_id: typeof body.faculdade_id,
        body_completo: body
      })
    }

    // Se action for 'delete', deletar a instância
    if (body.action === 'delete' && body.faculdade_id) {
      const faculdadeId = body.faculdade_id

      // Buscar faculdade
      const { data: faculdade, error: faculdadeError } = await supabase
        .from('faculdades')
        .select('id, evolution_instance')
        .eq('id', faculdadeId)
        .single()

      if (faculdadeError || !faculdade) {
        return NextResponse.json(
          { error: 'Faculdade não encontrada' },
          { status: 404 }
        )
      }

      // Se tem instância configurada, deletar na Evolution API
      if (faculdade.evolution_instance) {
        try {
          const config = await getEvolutionConfig()
          if (config.apiUrl && config.apiKey) {
            const deleteResponse = await fetch(`${config.apiUrl}/instance/delete/${faculdade.evolution_instance}`, {
              method: 'DELETE',
              headers: {
                'apikey': config.apiKey,
                'Content-Type': 'application/json'
              }
            })

            // Não falhar se a instância não existir na Evolution API
            if (!deleteResponse.ok && deleteResponse.status !== 404) {
              console.warn('Erro ao deletar instância na Evolution API:', deleteResponse.statusText)
            }
          }
        } catch (error) {
          console.warn('Erro ao deletar instância na Evolution API:', error)
        }
      }

      // Limpar dados da instância no banco
      const { error: updateError } = await supabase
        .from('faculdades')
        .update({
          evolution_instance: null,
          evolution_status: 'nao_configurado',
          evolution_qr_code: null,
          evolution_qr_expires_at: null,
          evolution_connected_at: null,
          evolution_last_error: null,
        })
        .eq('id', faculdadeId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Erro ao atualizar faculdade' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Instância deletada com sucesso'
      })
    }

    // Se action for 'get', apenas buscar a instância (mesmo comportamento do GET)
    if (body.action === 'get' && body.faculdade_id) {
      const faculdadeId = body.faculdade_id

      // Buscar faculdade
      const { data: faculdade, error: faculdadeError } = await supabase
        .from('faculdades')
        .select('id, nome, evolution_instance, evolution_status, evolution_qr_code, evolution_qr_expires_at, evolution_connected_at, evolution_last_error')
        .eq('id', faculdadeId)
        .single()

      if (faculdadeError || !faculdade) {
        return NextResponse.json(
          { error: 'Faculdade não encontrada' },
          { status: 404 }
        )
      }

      // Retornar dados da instância (mesma lógica do GET)
      let status = faculdade.evolution_status || 'nao_configurado'
      let qrCode = faculdade.evolution_qr_code || null
      let qrExpiresAt = faculdade.evolution_qr_expires_at || null
      let connectedAt = faculdade.evolution_connected_at || null

      // Se tem instância configurada, verificar status na Evolution API
      if (faculdade.evolution_instance) {
        try {
          const config = await getEvolutionConfig()
          if (config.apiUrl && config.apiKey) {
            const instanceResponse = await fetch(`${config.apiUrl}/instance/fetchInstances`, {
              headers: {
                'apikey': config.apiKey,
                'Content-Type': 'application/json'
              }
            })

            if (instanceResponse.ok) {
              const instances = await instanceResponse.json()
              const instance = Array.isArray(instances)
                ? instances.find((inst: any) => inst.instanceName === faculdade.evolution_instance)
                : instances[faculdade.evolution_instance]

              if (instance) {
                const instanceStatus = instance.instance?.status || instance.status
                status = instanceStatus === 'open' ? 'conectado' : 'desconectado'

                if (status === 'conectado' && !connectedAt) {
                  connectedAt = new Date().toISOString()
                }

                // Atualizar status no banco
                await supabase
                  .from('faculdades')
                  .update({
                    evolution_status: status,
                    evolution_connected_at: status === 'conectado' ? connectedAt : faculdade.evolution_connected_at,
                  })
                  .eq('id', faculdadeId)
              }
            }
          }
        } catch (error) {
          console.warn('Erro ao verificar status:', error)
        }
      }

      return NextResponse.json({
        faculdade_id: faculdade.id,
        instance_name: faculdade.evolution_instance,
        status,
        qr_code: qrCode,
        qr_expires_at: qrExpiresAt,
        connected_at: connectedAt,
        last_error: faculdade.evolution_last_error,
      })
    }

    // Se action for 'sync-chats', sincronizar conversas da Evolution API
    console.log('Verificando action:', body.action, 'faculdade_id:', body.faculdade_id)
    if (body.action === 'sync-chats' && body.faculdade_id) {
      console.log('Action sync-chats detectada, iniciando sincronização...')
      const faculdadeId = body.faculdade_id

      // Buscar faculdade e instância
      const { data: faculdade, error: faculdadeError } = await supabase
        .from('faculdades')
        .select('id, evolution_instance, evolution_api_url, evolution_api_key')
        .eq('id', faculdadeId)
        .single()

      if (faculdadeError || !faculdade) {
        console.error('Sync-chats: Faculdade não encontrada. ID:', faculdadeId, 'Erro:', faculdadeError)
        return NextResponse.json(
          { error: 'Faculdade não encontrada', details: faculdadeError, id_recebido: faculdadeId },
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
            .eq('faculdade_id', faculdadeId)
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
                faculdade_id: faculdadeId,
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
    }

    const validation = createInstanceSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]

      // Log detalhado do erro de validação (sempre logar em desenvolvimento)
      console.error('Erro de validação ao criar instância:', {
        issues: validation.error.issues,
        body_recebido: body,
        faculdade_id_tipo: typeof body.faculdade_id,
        faculdade_id_valor: body.faculdade_id,
        instance_name_tipo: typeof body.instance_name,
        instance_name_valor: body.instance_name
      })

      const errorResponse = {
        error: firstError?.message || 'Erro de validação',
        details: `Campo inválido: ${firstError?.path?.join('.') || 'desconhecido'}. Valor recebido: ${JSON.stringify(body[firstError?.path?.[0] || ''])}`,
        issues: validation.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          received_value: body[issue.path[0]]
        }))
      }

      console.log('Retornando erro de validação:', errorResponse)

      return NextResponse.json(errorResponse, { status: 400 })
    }

    const { faculdade_id, instance_name } = validation.data

    // Verificar se faculdade existe
    const { data: faculdade, error: faculdadeError } = await supabase
      .from('faculdades')
      .select('id, nome')
      .eq('id', faculdade_id)
      .single()

    if (faculdadeError || !faculdade) {
      return NextResponse.json(
        { error: 'Faculdade não encontrada' },
        { status: 404 }
      )
    }

    // Buscar configuração global (banco de dados ou variáveis de ambiente)
    const config = await getEvolutionConfig()
    const apiUrl = config.apiUrl
    const apiKey = config.apiKey

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Evolution API não configurada. Configure no banco de dados (tabela configuracoes_globais) ou nas variáveis de ambiente EVOLUTION_API_URL e EVOLUTION_API_KEY.' },
        { status: 500 }
      )
    }

    // Criar instância na Evolution API
    try {
      const createResponse = await fetch(`${apiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          instanceName: instance_name,
          token: `${faculdade_id}_${instance_name}`, // Token único
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      })

      console.log('Evolution API Response Status:', createResponse.status)
      console.log('Evolution API URL used:', apiUrl)

      if (!createResponse.ok) {
        let errorMessage = `Erro ao criar instância: ${createResponse.statusText}`
        let errorDetails: any = {}
        let rawErrorText = ''

        try {
          rawErrorText = await createResponse.text()
          if (rawErrorText) {
            try {
              errorDetails = JSON.parse(rawErrorText)
              // Tentar extrair mensagem de diferentes formatos possíveis
              errorMessage = errorDetails.message ||
                errorDetails.error ||
                errorDetails.text ||
                errorDetails.description ||
                (typeof errorDetails === 'string' ? errorDetails : errorMessage)
            } catch {
              // Se não for JSON, usar o texto como mensagem
              errorMessage = rawErrorText || errorMessage
              errorDetails = { text: rawErrorText }
            }
          }
        } catch (parseError) {
          console.error('Erro ao fazer parse da resposta de erro da Evolution API:', parseError)
          errorDetails = { parseError: String(parseError), rawText: rawErrorText }
        }

        // Log detalhado do erro
        console.error('Erro ao criar instância na Evolution API:', {
          status: createResponse.status,
          statusText: createResponse.statusText,
          errorDetails,
          rawErrorText,
          instanceName: instance_name,
          apiUrl: apiUrl,
          requestBody: {
            instanceName: instance_name,
            token: `${faculdade_id}_${instance_name}`,
            qrcode: true
          }
        })

        // Mensagens mais específicas baseadas no status e conteúdo do erro
        const errorMessageLower = errorMessage.toLowerCase()
        if (createResponse.status === 400) {
          if (errorMessageLower.includes('already exists') ||
            errorMessageLower.includes('já existe') ||
            errorMessageLower.includes('duplicate') ||
            errorMessageLower.includes('duplicado')) {
            errorMessage = `O nome da instância "${instance_name}" já está em uso. Escolha outro nome.`
          } else if (errorMessageLower.includes('invalid') ||
            errorMessageLower.includes('inválido') ||
            errorMessageLower.includes('not allowed') ||
            errorMessageLower.includes('não permitido')) {
            errorMessage = `Nome da instância inválido: "${instance_name}". Use apenas letras, números e hífens.`
          } else if (errorMessageLower.includes('required') ||
            errorMessageLower.includes('obrigatório')) {
            errorMessage = `Campos obrigatórios faltando. Verifique os dados enviados.`
          } else {
            // Manter a mensagem original se não for um dos casos acima
            errorMessage = errorMessage || `Dados inválidos. Verifique o nome da instância e tente novamente.`
          }
        } else if (createResponse.status === 401 || createResponse.status === 403) {
          errorMessage = 'Erro de autenticação com a Evolution API. Verifique a chave de API.'
        } else if (createResponse.status === 404) {
          errorMessage = 'Endpoint da Evolution API não encontrado. Verifique a URL da API.'
        }

        return NextResponse.json(
          {
            error: errorMessage,
            details: {
              status: createResponse.status,
              error: createResponse.statusText,
              response: errorDetails,
              rawText: rawErrorText
            },
            evolutionApiStatus: createResponse.status
          },
          { status: 400 }
        )
      }

      // Buscar QR code
      const qrResponse = await fetch(`${apiUrl}/instance/connect/${instance_name}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
      })

      let qrCode = null
      let qrExpiresAt = null

      if (qrResponse.ok) {
        const qrData = await qrResponse.json()
        if (qrData.qrcode) {
          qrCode = qrData.qrcode.base64 || qrData.qrcode
          qrExpiresAt = new Date(Date.now() + 40 * 1000).toISOString()
        }
      }

      // Configurar webhook para receber mensagens
      try {
        const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evolution`
          : `${request.headers.get('origin') || 'http://localhost:3000'}/api/webhooks/evolution`

        console.log('Configurando webhook para instância:', instance_name)
        console.log('Webhook URL:', webhookUrl)

        const webhookResponse = await fetch(`${apiUrl}/webhook/set/${instance_name}`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            webhook: {
              enabled: true,
              url: webhookUrl,
              webhookByEvents: true,
              events: [
                'MESSAGES_UPSERT',
                'MESSAGES_UPDATE',
                'CONNECTION_UPDATE',
                'QRCODE_UPDATED'
              ]
            }
          })
        })

        if (webhookResponse.ok) {
          const webhookData = await webhookResponse.json()
          console.log('Webhook configurado com sucesso:', webhookData)
        } else {
          const webhookError = await webhookResponse.text()
          console.warn('Erro ao configurar webhook (não crítico):', webhookError)
          // Não falhar a criação da instância se o webhook falhar
        }
      } catch (webhookError) {
        console.warn('Erro ao configurar webhook (não crítico):', webhookError)
        // Não falhar a criação da instância se o webhook falhar
      }

      // Atualizar faculdade com dados da instância (não atualizar api_url e api_key se não foram fornecidos)
      const updateData: any = {
        evolution_instance: instance_name,
        evolution_status: 'conectando',
        evolution_qr_code: qrCode,
        evolution_qr_expires_at: qrExpiresAt,
        evolution_last_error: null,
      }

      const { error: updateError } = await supabase
        .from('faculdades')
        .update(updateData)
        .eq('id', faculdade_id)

      if (updateError) {
        console.error('Erro ao atualizar faculdade:', updateError)
        return NextResponse.json(
          { error: 'Erro ao salvar configuração da instância' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Instância criada com sucesso',
        instance_name,
        qr_code: qrCode,
        qr_expires_at: qrExpiresAt,
      })
    } catch (error: any) {
      console.error('Erro ao criar instância:', error)
      return NextResponse.json(
        { error: error.message || 'Erro ao criar instância na Evolution API' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Deletar instância Evolution
 */
export async function DELETE(request: NextRequest) {
  try {
    // Usar nextUrl que é a forma recomendada no Next.js 13+
    const { searchParams } = request.nextUrl
    const faculdadeId = searchParams.get('faculdade_id')

    if (!faculdadeId) {
      console.log('DELETE /api/evolution/instance - faculdade_id missing')
      return NextResponse.json(
        {
          error: 'faculdade_id é obrigatório',
          details: `É necessário fornecer o ID da faculdade para deletar a instância Evolution. URL recebida: ${request.nextUrl.href}`,
          solution: 'Certifique-se de que o parâmetro faculdade_id está sendo enviado na requisição.'
        },
        { status: 400 }
      )
    }

    // Buscar faculdade
    const { data: faculdade, error: faculdadeError } = await supabase
      .from('faculdades')
      .select('id, evolution_instance, evolution_api_url, evolution_api_key')
      .eq('id', faculdadeId)
      .single()

    if (faculdadeError || !faculdade) {
      console.log('DELETE /api/evolution/instance - Faculdade not found:', faculdadeId, faculdadeError)
      return NextResponse.json(
        { error: 'Faculdade não encontrada' },
        { status: 404 }
      )
    }

    if (!faculdade.evolution_instance) {
      return NextResponse.json(
        { error: 'Instância não configurada' },
        { status: 400 }
      )
    }

    // Buscar configuração global (banco de dados ou variáveis de ambiente)
    const config = await getEvolutionConfig()
    const apiUrl = config.apiUrl
    const apiKey = config.apiKey

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Evolution API não configurada. Configure no banco de dados (tabela configuracoes_globais) ou nas variáveis de ambiente EVOLUTION_API_URL e EVOLUTION_API_KEY.' },
        { status: 500 }
      )
    }

    // Deletar instância na Evolution API
    try {
      const deleteResponse = await fetch(`${apiUrl}/instance/delete/${faculdade.evolution_instance}`, {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
        },
      })

      // Continuar mesmo se a API retornar erro (instância pode não existir)
      if (!deleteResponse.ok) {
        console.warn('Aviso ao deletar instância:', await deleteResponse.text())
      }
    } catch (error) {
      console.warn('Erro ao deletar instância na API (continuando):', error)
    }

    // Limpar dados da instância na faculdade
    const { error: updateError } = await supabase
      .from('faculdades')
      .update({
        evolution_instance: null,
        evolution_status: 'desconectado',
        evolution_qr_code: null,
        evolution_qr_expires_at: null,
        evolution_connected_at: null,
        evolution_last_error: null,
      })
      .eq('id', faculdadeId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao limpar configuração da instância' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Instância deletada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao deletar instância:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Configurar webhook para instância existente
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const faculdadeId = searchParams.get('faculdade_id')

    if (!faculdadeId) {
      return NextResponse.json(
        { error: 'ID da faculdade não fornecido' },
        { status: 400 }
      )
    }

    // Buscar faculdade
    const { data: faculdade, error: faculdadeError } = await supabase
      .from('faculdades')
      .select('id, evolution_instance')
      .eq('id', faculdadeId)
      .single()

    if (faculdadeError || !faculdade) {
      return NextResponse.json(
        { error: 'Faculdade não encontrada' },
        { status: 404 }
      )
    }

    if (!faculdade.evolution_instance) {
      return NextResponse.json(
        { error: 'Instância não configurada' },
        { status: 400 }
      )
    }

    // Buscar configuração global
    const config = await getEvolutionConfig()
    const apiUrl = config.apiUrl
    const apiKey = config.apiKey

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Evolution API não configurada' },
        { status: 500 }
      )
    }

    // Configurar webhook
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evolution`
      : `${request.headers.get('origin') || 'http://localhost:3000'}/api/webhooks/evolution`

    console.log('=== PATCH /api/evolution/instance - Configurar Webhook ===')
    console.log('Faculdade ID:', faculdadeId)
    console.log('Instância:', faculdade.evolution_instance)
    console.log('Webhook URL:', webhookUrl)
    console.log('API URL:', apiUrl)
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'não configurada')

    const webhookPayload = {
      enabled: true,
      url: webhookUrl,
      webhookByEvents: true,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED'
      ]
    }

    console.log('Payload do webhook:', JSON.stringify(webhookPayload, null, 2))

    const webhookResponse = await fetch(`${apiUrl}/webhook/set/${faculdade.evolution_instance}`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ webhook: webhookPayload })
    })

    console.log('Status da resposta:', webhookResponse.status)
    console.log('Status text:', webhookResponse.statusText)

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error('Erro ao configurar webhook (Evolution API):', errorText)

      let errorMessage = 'Erro ao configurar webhook'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorJson.error || errorText
      } catch {
        errorMessage = errorText || 'Erro desconhecido'
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorText,
          webhookUrl,
          instanceName: faculdade.evolution_instance
        },
        { status: 400 }
      )
    }

    const webhookData = await webhookResponse.json()
    console.log('Webhook configurado com sucesso:', webhookData)

    return NextResponse.json({
      success: true,
      message: 'Webhook configurado com sucesso',
      webhook: webhookData
    })
  } catch (error) {
    console.error('Erro ao configurar webhook:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error) },
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

