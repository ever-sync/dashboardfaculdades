import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Webhook para receber mensagens do WhatsApp
 * 
 * Este endpoint recebe notificações de novos mensagens de diferentes provedores:
 * - Evolution API
 * - Twilio WhatsApp
 * - Baileys
 * 
 * Configure o webhook no seu provedor para apontar para:
 * https://seu-dominio.com/api/whatsapp/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verificar assinatura do webhook (segurança)
    const signature = request.headers.get('x-signature') || request.headers.get('x-hub-signature-256')
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET

    if (webhookSecret && signature) {
      // TODO: Implementar verificação de assinatura HMAC
      // const isValid = verifySignature(body, signature, webhookSecret)
      // if (!isValid) {
      //   return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
      // }
    }

    // Detectar provedor baseado na estrutura do body
    const provider = detectProvider(body)

    // Processar mensagem de acordo com o provedor
    let messageData: {
      phoneNumber: string
      content: string
      messageId: string
      timestamp: string
      type: 'texto' | 'imagem' | 'documento' | 'audio' | 'video'
    } | null = null

    switch (provider) {
      case 'evolution':
        messageData = parseEvolutionWebhook(body)
        break
      case 'twilio':
        messageData = parseTwilioWebhook(body)
        break
      case 'baileys':
        messageData = parseBaileysWebhook(body)
        break
      default:
        // Tentar parsear como formato genérico
        messageData = parseGenericWebhook(body)
    }

    if (!messageData) {
      return NextResponse.json(
        { error: 'Formato de webhook não reconhecido' },
        { status: 400 }
      )
    }

    // Buscar ou criar conversa
    const { data: faculdades } = await supabase
      .from('faculdades')
      .select('id')
      .limit(1)
      .single()

    if (!faculdades) {
      return NextResponse.json(
        { error: 'Nenhuma faculdade encontrada' },
        { status: 500 }
      )
    }

    const faculdadeId = faculdades.id

    // Buscar conversa existente ou criar nova
    let { data: conversa, error: conversaError } = await supabase
      .from('conversas_whatsapp')
      .select('id, faculdade_id')
      .eq('telefone', messageData.phoneNumber)
      .eq('faculdade_id', faculdadeId)
      .maybeSingle()

    if (conversaError || !conversa) {
      // Criar nova conversa
      const { data: novaConversa, error: createError } = await supabase
        .from('conversas_whatsapp')
        .insert({
          faculdade_id: faculdadeId,
          telefone: messageData.phoneNumber,
          nome: messageData.phoneNumber, // Será atualizado quando obter nome do prospect
          status: 'ativo',
          status_conversa: 'ativa',
          ultima_mensagem: messageData.content,
          data_ultima_mensagem: messageData.timestamp,
          nao_lidas: 1,
          departamento: 'WhatsApp',
          setor: 'Atendimento',
        })
        .select()
        .single()

      if (createError || !novaConversa) {
        return NextResponse.json(
          { error: 'Erro ao criar conversa' },
          { status: 500 }
        )
      }

      conversa = novaConversa
    } else {
      // Atualizar conversa existente
      await supabase
        .from('conversas_whatsapp')
        .update({
          ultima_mensagem: messageData.content,
          data_ultima_mensagem: messageData.timestamp,
          nao_lidas: (conversa as any).nao_lidas ? (conversa as any).nao_lidas + 1 : 1,
          status: 'ativo',
          status_conversa: 'ativa',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversa.id)
    }

    if (!conversa) {
      return NextResponse.json(
        { error: 'Erro ao processar conversa' },
        { status: 500 }
      )
    }

    // Inserir mensagem no banco
    const { error: messageError } = await supabase
      .from('mensagens')
      .insert({
        conversa_id: conversa.id,
        conteudo: messageData.content,
        remetente: 'cliente', // Mensagem recebida do cliente
        tipo_mensagem: messageData.type,
        timestamp: messageData.timestamp,
        lida: false,
      })

    if (messageError) {
      console.error('Erro ao inserir mensagem:', messageError)
      // Não retornar erro 500 para evitar retry infinito
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processado com sucesso',
      conversa_id: conversa.id,
    })
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error)

    // Retornar 200 para evitar retry desnecessário do provedor
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao processar webhook',
    })
  }
}

/**
 * Detecta o provedor baseado na estrutura do webhook
 */
function detectProvider(body: any): string {
  // Evolution API
  if (body.key || body.data?.key) {
    return 'evolution'
  }

  // Twilio
  if (body.MessageSid || body.SmsMessageSid || body.AccountSid) {
    return 'twilio'
  }

  // Baileys
  if (body.messages || body.messageId) {
    return 'baileys'
  }

  return 'generic'
}

/**
 * Parse webhook da Evolution API
 */
function parseEvolutionWebhook(body: any) {
  const message = body.data || body
  const key = message.key || message.data?.key

  if (!key) return null

  return {
    phoneNumber: key.remoteJid?.replace('@s.whatsapp.net', '') || key.from || '',
    content: message.message?.conversation || message.message?.extendedTextMessage?.text || message.body || '',
    messageId: key.id || message.key?.id || '',
    timestamp: new Date(message.messageTimestamp * 1000).toISOString(),
    type: 'texto' as const,
  }
}

/**
 * Parse webhook do Twilio
 */
function parseTwilioWebhook(body: any) {
  return {
    phoneNumber: body.From?.replace('whatsapp:', '') || '',
    content: body.Body || body.MessageBody || '',
    messageId: body.MessageSid || body.SmsMessageSid || '',
    timestamp: new Date().toISOString(),
    type: 'texto' as const,
  }
}

/**
 * Parse webhook do Baileys
 */
function parseBaileysWebhook(body: any) {
  const message = body.messages?.[0] || body

  return {
    phoneNumber: message.from?.replace('@s.whatsapp.net', '') || message.key?.remoteJid?.replace('@s.whatsapp.net', '') || '',
    content: message.message?.conversation || message.message?.extendedTextMessage?.text || message.body || '',
    messageId: message.key?.id || message.messageId || '',
    timestamp: new Date(message.messageTimestamp * 1000 || Date.now()).toISOString(),
    type: 'texto' as const,
  }
}

/**
 * Parse webhook genérico (tenta múltiplos formatos)
 */
function parseGenericWebhook(body: any) {
  return {
    phoneNumber: body.phone || body.phoneNumber || body.from || body.number || '',
    content: body.content || body.message || body.text || body.body || '',
    messageId: body.id || body.messageId || body.message_id || `generic_${Date.now()}`,
    timestamp: body.timestamp || body.created_at || new Date().toISOString(),
    type: (body.type || 'texto') as 'texto' | 'imagem' | 'documento' | 'audio' | 'video',
  }
}

