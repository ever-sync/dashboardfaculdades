import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Schema de validação para mensagens da IA do n8n
const mensagemIASchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido').optional(),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  conteudo: z.string().min(1, 'Conteúdo da mensagem é obrigatório').max(4096, 'Mensagem muito longa'),
  faculdade_id: z.string().uuid('ID de faculdade inválido').optional(),
  nome_cliente: z.string().optional(),
  tipo_mensagem: z.enum(['texto', 'imagem', 'documento', 'audio', 'video']).optional().default('texto'),
})

/**
 * API para receber notificações do n8n quando a IA responde
 * 
 * Este endpoint é chamado pelo n8n após a IA gerar uma resposta.
 * Ele salva a mensagem no banco de dados e sincroniza com as tabelas do n8n.
 * 
 * Formato esperado do payload:
 * {
 *   "conversa_id": "uuid-da-conversa" (opcional, será buscado se não fornecido),
 *   "telefone": "5512981092776@s.whatsapp.net" ou "5512981092776",
 *   "conteudo": "Mensagem gerada pela IA",
 *   "faculdade_id": "uuid-da-faculdade" (opcional),
 *   "nome_cliente": "Nome do Cliente" (opcional),
 *   "tipo_mensagem": "texto" (opcional, padrão: "texto")
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validation = mensagemIASchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Erro de validação' },
        { status: 400 }
      )
    }
    
    const { conversa_id, telefone, conteudo, faculdade_id, nome_cliente, tipo_mensagem } = validation.data

    // Normalizar telefone para diferentes formatos
    const phoneNumber = telefone.replace('@s.whatsapp.net', '').replace(/\D/g, '')
    const phoneWithSuffix = telefone.includes('@') 
      ? telefone 
      : `${phoneNumber}@s.whatsapp.net`

    // Buscar ou criar conversa
    let conversaId = conversa_id

    if (!conversaId) {
      // Buscar conversa existente pelo telefone
      let faculdadeId = faculdade_id

      if (!faculdadeId) {
        // Tentar buscar faculdade pela instância Evolution (se disponível)
        // Por enquanto, retornar erro se não fornecido
        return NextResponse.json(
          { error: 'faculdade_id ou conversa_id é obrigatório quando conversa_id não é fornecido' },
          { status: 400 }
        )
      }

      const { data: conversaExistente, error: conversaError } = await supabase
        .from('conversas_whatsapp')
        .select('id, faculdade_id, nome')
        .eq('telefone', phoneWithSuffix)
        .eq('faculdade_id', faculdadeId)
        .maybeSingle()

      if (conversaError) {
        console.error('Erro ao buscar conversa:', conversaError)
        return NextResponse.json(
          { error: 'Erro ao buscar conversa existente' },
          { status: 500 }
        )
      }

      if (conversaExistente) {
        conversaId = conversaExistente.id
      } else {
        // Criar nova conversa se não existir
        const { data: novaConversa, error: createError } = await supabase
          .from('conversas_whatsapp')
          .insert({
            faculdade_id: faculdadeId,
            telefone: phoneWithSuffix,
            nome: nome_cliente || phoneNumber,
            status: 'ativo',
            status_conversa: 'ativa',
            ultima_mensagem: conteudo,
            data_ultima_mensagem: new Date().toISOString(),
            nao_lidas: 0,
            departamento: 'WhatsApp',
            setor: 'Atendimento',
          })
          .select()
          .single()

        if (createError || !novaConversa) {
          console.error('Erro ao criar conversa:', createError)
          return NextResponse.json(
            { error: 'Erro ao criar conversa' },
            { status: 500 }
          )
        }

        conversaId = novaConversa.id
      }
    } else {
      // Verificar se conversa existe
      const { data: conversa, error: conversaError } = await supabase
        .from('conversas_whatsapp')
        .select('id, faculdade_id, nome')
        .eq('id', conversaId)
        .single()

      if (conversaError || !conversa) {
        return NextResponse.json(
          { error: 'Conversa não encontrada' },
          { status: 404 }
        )
      }
    }

    if (!conversaId) {
      return NextResponse.json(
        { error: 'Não foi possível identificar ou criar a conversa' },
        { status: 500 }
      )
    }

    const timestamp = new Date().toISOString()

    // Salvar mensagem da IA na tabela mensagens
    const { data: mensagem, error: mensagemError } = await supabase
      .from('mensagens')
      .insert({
        conversa_id: conversaId,
        conteudo: conteudo.trim(),
        remetente: 'bot', // IMPORTANTE: usar 'bot' (não 'remetente_msg')
        tipo_mensagem: tipo_mensagem as any,
        timestamp,
        lida: false,
      })
      .select()
      .single()

    if (mensagemError) {
      console.error('Erro ao salvar mensagem da IA:', mensagemError)
      return NextResponse.json(
        { error: 'Erro ao salvar mensagem da IA' },
        { status: 500 }
      )
    }

    // Atualizar última mensagem na conversa
    const { data: conversaAtualizada } = await supabase
      .from('conversas_whatsapp')
      .select('nome, faculdade_id')
      .eq('id', conversaId)
      .single()

    await supabase
      .from('conversas_whatsapp')
      .update({
        ultima_mensagem: conteudo.trim(),
        data_ultima_mensagem: timestamp,
        updated_at: timestamp,
      })
      .eq('id', conversaId)

    // Sincronizar com tabelas do n8n (opcional - apenas se as tabelas existirem)
    try {
      const nomeCliente = nome_cliente || conversaAtualizada?.nome || phoneNumber

      // Atualizar ou criar registro na tabela chats (formato n8n)
      const { error: chatError } = await supabase
        .from('chats')
        .upsert({
          phone: phoneWithSuffix,
          updated_at: timestamp,
        }, {
          onConflict: 'phone',
        })

      if (chatError) {
        console.warn('Erro ao sincronizar tabela chats (pode não existir):', chatError.message)
      }

      // Salvar mensagem na tabela chat_messages (formato n8n)
      const { error: chatMessageError } = await supabase
        .from('chat_messages')
        .insert({
          phone: phoneWithSuffix,
          nomewpp: nomeCliente,
          user_message: null, // Mensagem do cliente (não aplicável aqui, é mensagem da IA)
          bot_message: conteudo.trim(), // Mensagem da IA
          created_at: timestamp,
        })

      if (chatMessageError) {
        console.warn('Erro ao sincronizar tabela chat_messages (pode não existir):', chatMessageError.message)
      }
    } catch (syncError: any) {
      // Não falhar se a sincronização com n8n falhar
      console.warn('Erro ao sincronizar com tabelas do n8n:', syncError.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem da IA salva com sucesso',
      mensagem_id: mensagem.id,
      conversa_id: conversaId,
    })
  } catch (error) {
    console.error('Erro ao processar mensagem da IA:', error)
    
    return NextResponse.json(
      { error: getUserFriendlyError(error) },
      { status: 500 }
    )
  }
}

/**
 * GET - Verificar status do endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/n8n/mensagem-ia',
    description: 'Endpoint para receber notificações do n8n quando a IA responde',
    method: 'POST',
    required_fields: ['telefone', 'conteudo'],
    optional_fields: ['conversa_id', 'faculdade_id', 'nome_cliente', 'tipo_mensagem'],
  })
}

