import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateData } from '@/lib/schemas'
import { getUserFriendlyError } from '@/lib/errorMessages'
import { validarConversaFaculdade } from '@/lib/faculdadeValidation'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin

// Schema de validação
const agendarMensagemSchema = z.object({
  faculdade_id: z.string().uuid('ID de faculdade inválido'),
  conversa_id: z.string().uuid('ID de conversa inválido').optional(),
  telefone: z.string().min(10, 'Telefone inválido').max(20, 'Telefone muito longo'),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório').max(4096, 'Mensagem muito longa'),
  tipo_mensagem: z.enum(['texto', 'imagem', 'documento', 'audio', 'video']).optional().default('texto'),
  midia_url: z.string().url('URL inválida').optional(),
  data_agendamento: z.string().datetime('Data de agendamento inválida'),
  remetente: z.enum(['usuario', 'agente', 'bot', 'robo', 'humano', 'cliente']).optional().default('agente'),
  atendente_id: z.string().uuid('ID de atendente inválido').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar dados
    const validation = validateData(agendarMensagemSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const {
      faculdade_id,
      conversa_id,
      telefone,
      conteudo,
      tipo_mensagem,
      midia_url,
      data_agendamento,
      remetente,
      atendente_id,
    } = validation.data

    // Se conversa_id foi fornecido, validar que pertence à faculdade
    if (conversa_id) {
      const validacao = await validarConversaFaculdade(conversa_id, faculdade_id)
      if (!validacao.valido) {
        return NextResponse.json(
          { error: validacao.erro || 'Conversa não pertence à faculdade' },
          { status: 403 }
        )
      }
    }

    // Verificar se a data é no futuro
    const dataAgendamento = new Date(data_agendamento)
    if (dataAgendamento <= new Date()) {
      return NextResponse.json(
        { error: 'A data de agendamento deve ser no futuro' },
        { status: 400 }
      )
    }

    // Inserir mensagem agendada
    const { data, error } = await supabase
      .from('mensagens_agendadas')
      .insert({
        faculdade_id,
        conversa_id: conversa_id || null,
        telefone,
        conteudo,
        tipo_mensagem,
        midia_url: midia_url || null,
        data_agendamento: dataAgendamento.toISOString(),
        status: 'pendente',
        remetente,
        atendente_id: atendente_id || null,
        tentativas: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao agendar mensagem:', error)
      return NextResponse.json(
        { error: getUserFriendlyError(error.message) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mensagem: data,
    })
  } catch (error: any) {
    console.error('Erro ao agendar mensagem:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

// GET - Listar mensagens agendadas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const faculdadeId = searchParams.get('faculdade_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!faculdadeId) {
      return NextResponse.json(
        { error: 'faculdade_id é obrigatório' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('mensagens_agendadas')
      .select('*')
      .eq('faculdade_id', faculdadeId)
      .order('data_agendamento', { ascending: true })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar mensagens agendadas:', error)
      return NextResponse.json(
        { error: getUserFriendlyError(error.message) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mensagens: data || [],
      total: data?.length || 0,
    })
  } catch (error: any) {
    console.error('Erro ao buscar mensagens agendadas:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

