import { NextRequest, NextResponse } from 'next/server'
import { getUserFriendlyError } from '@/lib/errorMessages'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
async function sendViaEvolutionAPI(phoneNumber: string, conteudo: string): Promise<{ success: boolean; message_id?: string; error?: string }> {
  const evolutionApiUrl = process.env.EVOLUTION_API_URL
  const evolutionApiKey = process.env.EVOLUTION_API_KEY
  const evolutionInstance = process.env.EVOLUTION_API_INSTANCE

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

/**
 * API para envio de mensagens WhatsApp
 * 
 * Suporta múltiplos provedores:
 * - Evolution API (recomendado para self-hosted)
 * - Twilio WhatsApp (serviço gerenciado)
 * - Baileys (self-hosted alternativo)
 * 
 * Configure as variáveis de ambiente conforme o provedor escolhido:
 * - Evolution API: EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_API_INSTANCE
 * - Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSPP_FROM
 * - Baileys: BAILEYS_API_URL, BAILEYS_API_KEY
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validation = sendMessageSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }
    
    const { conversa_id, conteudo, remetente, tipo_mensagem } = validation.data
    
    // Buscar informações da conversa para obter o número do telefone
    const { data: conversa, error: conversaError } = await supabase
      .from('conversas_whatsapp')
      .select('telefone, faculdade_id')
      .eq('id', conversa_id)
      .single()

    if (conversaError || !conversa) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    const phoneNumber = conversa.telefone
    
    // Determinar provedor (prioridade: Evolution > Twilio > Baileys)
    const provider = process.env.WHATSAPP_PROVIDER || 'evolution' // ou 'twilio', 'baileys'
    
    let sendResult: { success: boolean; message_id?: string; error?: string }

    switch (provider.toLowerCase()) {
      case 'evolution':
        sendResult = await sendViaEvolutionAPI(phoneNumber, conteudo)
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
      await supabase
        .from('mensagens')
        .insert({
          conversa_id,
          conteudo,
          remetente: remetente as any,
          tipo_mensagem: tipo_mensagem as any,
          lida: false,
        })

      return NextResponse.json(
        { error: sendResult.error || 'Erro ao enviar mensagem via WhatsApp' },
        { status: 500 }
      )
    }

    // Atualizar última mensagem na conversa
    await supabase
      .from('conversas_whatsapp')
      .update({
        ultima_mensagem: conteudo,
        data_ultima_mensagem: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversa_id)

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
        const evolutionApiUrl = process.env.EVOLUTION_API_URL
        const evolutionApiKey = process.env.EVOLUTION_API_KEY
        const evolutionInstance = process.env.EVOLUTION_API_INSTANCE

        if (evolutionApiUrl && evolutionApiKey && evolutionInstance) {
          try {
            const response = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
              method: 'GET',
              headers: {
                'apikey': evolutionApiKey,
              },
            })

            if (response.ok) {
              const data = await response.json()
              const instance = data.find((inst: any) => inst.instance.instanceName === evolutionInstance)
              connected = instance?.instance?.status === 'open'
              statusMessage = connected 
                ? `Evolution API conectado (${evolutionInstance})`
                : `Evolution API não está conectado (${evolutionInstance})`
            }
          } catch (error) {
            statusMessage = 'Erro ao verificar status do Evolution API'
          }
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
