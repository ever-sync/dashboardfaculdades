import { NextRequest, NextResponse } from 'next/server'
import { getUserFriendlyError } from '@/lib/errorMessages'
import { z } from 'zod'
import { getEvolutionConfig } from '@/lib/evolutionConfig'
import { validateData } from '@/lib/schemas'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin

// Schema de validação para envio de mensagens
const sendMessageSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
  conteudo: z.string().min(1, 'Conteúdo da mensagem é obrigatório').max(4096, 'Mensagem muito longa'),
  remetente: z.enum(['usuario', 'agente', 'bot', 'robo', 'humano', 'cliente']).optional().default('agente'),
  tipo_mensagem: z.enum(['texto', 'imagem', 'documento', 'audio', 'video']).optional().default('texto'),
})

/**
 * Função auxiliar para enviar mensagem via Evolution API
 */
async function sendViaEvolutionAPI(
  phoneNumber: string,
  conteudo: string,
  apiUrl?: string,
  apiKey?: string,
  instance?: string
): Promise<{ success: boolean; message_id?: string; error?: string }> {
  const evolutionApiUrl = apiUrl || process.env.EVOLUTION_API_URL
  const evolutionApiKey = apiKey || process.env.EVOLUTION_API_KEY
  const evolutionInstance = instance || process.env.EVOLUTION_API_INSTANCE

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    return { success: false, error: 'Evolution API não configurada' }
  }

  try {
    const response = await fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: phoneNumber.replace(/\D/g, ''), // Remove caracteres não numéricos
        text: conteudo,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { success: false, error: errorData.message || `Erro ${response.status}: ${response.statusText}` }
    }

    const data = await response.json()
    return {
      success: true,
      message_id: data.key?.id || data.messageId || undefined
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao conectar com Evolution API' }
  }
}

/**
 * Função auxiliar para enviar mensagem via Twilio WhatsApp
 */
async function sendViaTwilio(phoneNumber: string, conteudo: string): Promise<{ success: boolean; message_id?: string; error?: string }> {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
  const twilioWhatsAppFrom = process.env.TWILIO_WHATSPP_FROM

  if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppFrom) {
    return { success: false, error: 'Twilio não configurado' }
  }

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        From: twilioWhatsAppFrom,
        To: `whatsapp:${phoneNumber.replace(/\D/g, '')}`,
        Body: conteudo,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { success: false, error: errorData.message || `Erro ${response.status}: ${response.statusText}` }
    }

    const data = await response.json()
    return {
      success: true,
      message_id: data.sid
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao conectar com Twilio' }
  }
}

/**
 * Função auxiliar para enviar mensagem via Baileys (self-hosted)
 */
async function sendViaBaileys(phoneNumber: string, conteudo: string): Promise<{ success: boolean; message_id?: string; error?: string }> {
  const baileysApiUrl = process.env.BAILEYS_API_URL
  const baileysApiKey = process.env.BAILEYS_API_KEY

  if (!baileysApiUrl || !baileysApiKey) {
    return { success: false, error: 'Baileys API não configurada' }
  }

  try {
    const response = await fetch(`${baileysApiUrl}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${baileysApiKey}`,
      },
      body: JSON.stringify({
        to: phoneNumber.replace(/\D/g, ''),
        message: conteudo,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { success: false, error: errorData.message || `Erro ${response.status}: ${response.statusText}` }
    }

    const data = await response.json()
    return {
      success: true,
      message_id: data.messageId || data.id || undefined
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao conectar com Baileys API' }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar dados de entrada
    const validation = validateData(sendMessageSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { conversa_id, conteudo, remetente, tipo_mensagem } = validation.data

    // Buscar informações da conversa para obter o número do telefone e nome
    const { data: conversa, error: conversaError } = await supabase
      .from('conversas_whatsapp')
      .select('telefone, faculdade_id, nome')
      .eq('id', conversa_id)
      .single()

    if (conversaError || !conversa) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    // Validar se a conversa tem faculdade_id
    if (!conversa.faculdade_id) {
      return NextResponse.json(
        {
          error: 'Conversa não possui faculdade associada.',
          details: 'Esta conversa não está vinculada a nenhuma faculdade. É necessário associar uma faculdade à conversa antes de enviar mensagens.',
          solution: 'Verifique se a conversa foi criada corretamente com um faculdade_id válido.'
        },
        { status: 400 }
      )
    }

    const phoneNumber = conversa.telefone
    const nomeCliente = conversa.nome || phoneNumber

    // Normalizar telefone para diferentes formatos
    // Formato para Evolution API: apenas números (ex: 5512981092776)
    const phoneForEvolution = phoneNumber.replace('@s.whatsapp.net', '').replace(/\D/g, '')

    // Formato para tabelas n8n: com sufixo @s.whatsapp.net (ex: 5512981092776@s.whatsapp.net)
    const phoneWithSuffix = phoneNumber.includes('@')
      ? phoneNumber
      : `${phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`

    // Buscar configuração da faculdade (instância Evolution)
    const { data: faculdade, error: faculdadeError } = await supabase
      .from('faculdades')
      .select('evolution_instance, evolution_status')
      .eq('id', conversa.faculdade_id)
      .single()

    // Verificar se a faculdade foi encontrada
    if (faculdadeError || !faculdade) {
      return NextResponse.json(
        {
          error: 'Faculdade não encontrada.',
          details: `A faculdade associada à conversa (ID: ${conversa.faculdade_id}) não foi encontrada no banco de dados.`,
          solution: 'Verifique se a faculdade existe e está ativa no sistema.'
        },
        { status: 404 }
      )
    }

    // Determinar provedor (prioridade: Evolution > Twilio > Baileys)
    const provider = process.env.WHATSAPP_PROVIDER || 'evolution' // ou 'twilio', 'baileys'

    let sendResult: { success: boolean; message_id?: string; error?: string }

    switch (provider.toLowerCase()) {
      case 'evolution':
        // Buscar configuração global (banco de dados ou variáveis de ambiente)
        const config = await getEvolutionConfig()
        const evolutionApiUrl = config.apiUrl
        const evolutionApiKey = config.apiKey
        // Instância é única por faculdade
        const evolutionInstance = faculdade?.evolution_instance || process.env.EVOLUTION_API_INSTANCE

        // Verificar configurações passo a passo
        if (!evolutionApiUrl || !evolutionApiKey) {
          return NextResponse.json(
            {
              error: 'Credenciais da Evolution API não configuradas.',
              details: 'Configure a URL e a chave da API em: Dashboard → Conversas → Ajustes → Evolution API',
              missing: {
                url: !evolutionApiUrl,
                key: !evolutionApiKey
              }
            },
            { status: 500 }
          )
        }

        if (!evolutionInstance) {
          return NextResponse.json(
            {
              error: 'Instância Evolution não configurada para esta faculdade.',
              details: `A faculdade "${conversa.nome || 'N/A'}" não possui uma instância Evolution configurada.`,
              solution: 'Acesse: Dashboard → Configurações → Seção "Instância Evolution API" e crie uma instância para esta faculdade.'
            },
            { status: 500 }
          )
        }

        // Verificar se instância está conectada
        if (faculdade?.evolution_status !== 'conectado') {
          const statusMessages: Record<string, string> = {
            'desconectado': 'A instância está desconectada. Escaneie o QR code para conectar.',
            'conectando': 'A instância está aguardando conexão. Escaneie o QR code no WhatsApp.',
            'erro': 'Houve um erro na conexão. Tente recriar a instância.',
            'nao_configurado': 'A instância não foi configurada ainda.'
          }

          return NextResponse.json(
            {
              error: `Instância Evolution não está conectada.`,
              status: faculdade?.evolution_status || 'desconectado',
              message: statusMessages[faculdade?.evolution_status || 'desconectado'] || 'Status desconhecido',
              solution: 'Acesse: Dashboard → Configurações → Seção "Instância Evolution API" e escaneie o QR code para conectar.'
            },
            { status: 503 }
          )
        }

        sendResult = await sendViaEvolutionAPI(phoneForEvolution, conteudo, evolutionApiUrl, evolutionApiKey, evolutionInstance)
        break
      case 'twilio':
        sendResult = await sendViaTwilio(phoneNumber, conteudo)
        break
      case 'baileys':
        sendResult = await sendViaBaileys(phoneNumber, conteudo)
        break
      default:
        // Modo desenvolvimento: simular envio
        if (process.env.NODE_ENV === 'development') {
          sendResult = { success: true, message_id: `mock_${Date.now()}` }
        } else {
          return NextResponse.json(
            { error: `Provedor WhatsApp não configurado: ${provider}` },
            { status: 500 }
          )
        }
    }

    if (!sendResult.success) {
      // Em caso de erro, ainda salvar a mensagem no banco como pendente
      const mensagemData = {
        conversa_id,
        conteudo,
        remetente: remetente as any,
        tipo_mensagem: tipo_mensagem as any,
        lida: false,
      }
      await (supabase
        .from('mensagens') as any)
        .insert(mensagemData as any)

      return NextResponse.json(
        { error: sendResult.error || 'Erro ao enviar mensagem via WhatsApp' },
        { status: 500 }
      )
    }

    // Salvar mensagem no banco após envio bem-sucedido
    // Usar upsert para evitar conflito com webhook SEND_MESSAGE que pode ter chegado primeiro
    const upsertData = {
      conversa_id,
      conteudo,
      remetente: 'agente',
      tipo_mensagem: tipo_mensagem as any,
      lida: true,
      timestamp: new Date().toISOString(),
      message_id: sendResult.message_id
    }
    await (supabase
      .from('mensagens') as any)
      .upsert(upsertData as any, {
        onConflict: 'message_id',
        ignoreDuplicates: true
      })

    // Atualizar última mensagem na conversa e zerar contador de não lidas
    const updateData = {
      ultima_mensagem: conteudo,
      data_ultima_mensagem: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      nao_lidas: 0,
    }
    await (supabase
      .from('conversas_whatsapp') as any)
      .update(updateData as any)
      .eq('id', conversa_id)

    // Sincronizar com tabelas do n8n (opcional - apenas se as tabelas existirem)
    // Esta sincronização garante que mensagens do app apareçam no histórico do n8n
    try {
      const timestamp = new Date().toISOString()

      // Atualizar ou criar registro na tabela chats (formato n8n)
      // Esta tabela mantém o registro de conversas ativas
      const upsertData = {
        phone: phoneWithSuffix, // Formato: 5512981092776@s.whatsapp.net
        updated_at: timestamp,
        created_at: timestamp, // Garantir que created_at seja definido na criação
      }
      const { error: chatError } = await (supabase
        .from('chats') as any)
        .upsert(upsertData as any, {
          onConflict: 'phone',
        })

      if (chatError) {
        // Verificar se é erro de tabela não existir (código 42P01) ou outro erro
        if (chatError.code === '42P01' || chatError.message?.includes('does not exist')) {
          console.warn('Tabela chats não existe no banco de dados. Sincronização com n8n desabilitada.')
        } else {
          console.warn('Erro ao sincronizar tabela chats:', chatError.message)
        }
      }

      // Salvar mensagem na tabela chat_messages (formato n8n)
      // Esta tabela mantém o histórico completo de mensagens
      const chatMessageData = {
        phone: phoneWithSuffix,
        nomewpp: nomeCliente,
        user_message: null, // Mensagem do cliente (não aplicável aqui, é mensagem do app)
        bot_message: conteudo.trim(), // Mensagem do atendente/bot enviada pelo app
        created_at: timestamp,
      }
      const { error: chatMessageError } = await (supabase
        .from('chat_messages') as any)
        .insert(chatMessageData as any)

      if (chatMessageError) {
        // Verificar se é erro de tabela não existir (código 42P01) ou outro erro
        if (chatMessageError.code === '42P01' || chatMessageError.message?.includes('does not exist')) {
          console.warn('Tabela chat_messages não existe no banco de dados. Sincronização com n8n desabilitada.')
        } else {
          console.warn('Erro ao sincronizar tabela chat_messages:', chatMessageError.message)
        }
      }
    } catch (syncError: any) {
      // Não falhar o envio se a sincronização com n8n falhar
      // A sincronização é opcional e não deve bloquear o envio de mensagens
      console.warn('Erro ao sincronizar com tabelas do n8n:', syncError.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      message_id: sendResult.message_id,
      provider,
    })
  } catch (error) {
    // Log erro em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao enviar mensagem WhatsApp:', error)
    }

    return NextResponse.json(
      { error: getUserFriendlyError(error) },
      { status: 500 }
    )
  }
}

/**
 * GET - Verificar status da integração WhatsApp
 */
export async function GET(request: NextRequest) {
  try {
    const provider = process.env.WHATSAPP_PROVIDER || 'evolution'
    let connected = false
    let statusMessage = 'Integração com WhatsApp Business não configurada'

    // Verificar status baseado no provedor
    switch (provider.toLowerCase()) {
      case 'evolution': {
        // Buscar configuração global (banco de dados ou variáveis de ambiente)
        const config = await getEvolutionConfig()
        const evolutionApiUrl = config.apiUrl
        const evolutionApiKey = config.apiKey

        if (evolutionApiUrl && evolutionApiKey) {
          try {
            const response = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
              method: 'GET',
              headers: {
                'apikey': evolutionApiKey,
              },
            })

            if (response.ok) {
              const data = await response.json()
              const instances = Array.isArray(data) ? data : Object.values(data)

              // Verificar se há pelo menos uma instância conectada
              const connectedInstances = instances.filter((inst: any) => {
                const status = inst.instance?.status || inst.status
                return status === 'open' || status === 'connected'
              })

              connected = connectedInstances.length > 0
              statusMessage = connected
                ? `Evolution API conectado (${connectedInstances.length} instância(s) ativa(s))`
                : instances.length > 0
                  ? `Evolution API configurado mas nenhuma instância conectada (${instances.length} instância(s) encontrada(s))`
                  : 'Evolution API configurado mas nenhuma instância encontrada'
            } else {
              const errorData = await response.json().catch(() => ({}))
              statusMessage = errorData.message || `Erro ${response.status}: ${response.statusText}`
            }
          } catch (error: any) {
            statusMessage = `Erro ao verificar status do Evolution API: ${error.message || 'Erro desconhecido'}`
          }
        } else {
          statusMessage = 'Evolution API não configurada. Configure a URL e a chave da API.'
        }
        break
      }
      case 'twilio': {
        const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
        const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN

        if (twilioAccountSid && twilioAuthToken) {
          try {
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}.json`, {
              method: 'GET',
              headers: {
                'Authorization': `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
              },
            })

            connected = response.ok
            statusMessage = connected
              ? 'Twilio WhatsApp conectado'
              : 'Twilio WhatsApp não está conectado'
          } catch (error) {
            statusMessage = 'Erro ao verificar status do Twilio'
          }
        }
        break
      }
      case 'baileys': {
        const baileysApiUrl = process.env.BAILEYS_API_URL
        const baileysApiKey = process.env.BAILEYS_API_KEY

        if (baileysApiUrl && baileysApiKey) {
          try {
            const response = await fetch(`${baileysApiUrl}/status`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${baileysApiKey}`,
              },
            })

            connected = response.ok
            statusMessage = connected
              ? 'Baileys API conectado'
              : 'Baileys API não está conectado'
          } catch (error) {
            statusMessage = 'Erro ao verificar status do Baileys API'
          }
        }
        break
      }
    }

    return NextResponse.json({
      connected,
      provider,
      message: statusMessage,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://seu-dominio.com'}/api/whatsapp/webhook`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getUserFriendlyError(error) },
      { status: 500 }
    )
  }
}
