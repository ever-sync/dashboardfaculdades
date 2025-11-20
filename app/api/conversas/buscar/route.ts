import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { validateData } from '@/lib/schemas'
import { getUserFriendlyError } from '@/lib/errorMessages'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Schema de validação
const buscarConversasSchema = z.object({
  query: z.string().min(1, 'Query é obrigatória').max(500, 'Query muito longa'),
  faculdade_id: z.string().uuid('ID de faculdade inválido'),
  setor: z.string().optional(),
  atendente_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  status: z.enum(['ativa', 'pendente', 'encerrada']).optional(),
  busca_mensagens: z.boolean().default(false), // Se true, busca no conteúdo das mensagens
  limite: z.number().int().min(1).max(100).default(50),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar dados
    const validation = validateData(buscarConversasSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const {
      query,
      faculdade_id,
      setor,
      atendente_id,
      tags,
      data_inicio,
      data_fim,
      status,
      busca_mensagens,
      limite,
    } = validation.data

    let conversas: any[] = []

    if (busca_mensagens) {
      // Busca full-text nas mensagens
      const { data: mensagensEncontradas, error: mensagensError } = await supabase
        .from('mensagens')
        .select('conversa_id')
        .ilike('conteudo', `%${query}%`)
        .limit(limite * 10) // Buscar mais para depois filtrar por faculdade

      if (mensagensError) {
        console.error('Erro ao buscar mensagens:', mensagensError)
        return NextResponse.json(
          { error: getUserFriendlyError(mensagensError.message) },
          { status: 500 }
        )
      }

      // Obter IDs únicos de conversas
      const conversaIds = [...new Set((mensagensEncontradas || []).map(m => m.conversa_id))]

      if (conversaIds.length === 0) {
        return NextResponse.json({
          success: true,
          conversas: [],
          total: 0,
        })
      }

      // Buscar conversas que têm mensagens correspondentes
      let queryConversas = supabase
        .from('conversas_whatsapp')
        .select(`
          *,
          prospects_academicos (
            id,
            nome,
            nome_completo,
            telefone
          )
        `)
        .in('id', conversaIds)
        .eq('faculdade_id', faculdade_id) // Sempre filtrar por faculdade
        .limit(limite)

      if (setor) {
        queryConversas = queryConversas.eq('setor', setor)
      }

      if (atendente_id) {
        queryConversas = queryConversas.eq('atendente_id', atendente_id)
      }

      if (status) {
        queryConversas = queryConversas.eq('status_conversa', status)
      }

      if (data_inicio) {
        queryConversas = queryConversas.gte('created_at', data_inicio)
      }

      if (data_fim) {
        queryConversas = queryConversas.lte('created_at', data_fim)
      }

      if (tags && tags.length > 0) {
        // Filtrar conversas que contêm pelo menos uma das tags
        queryConversas = queryConversas.contains('tags', tags)
      }

      const { data: conversasData, error: conversasError } = await queryConversas

      if (conversasError) {
        console.error('Erro ao buscar conversas:', conversasError)
        return NextResponse.json(
          { error: getUserFriendlyError(conversasError.message) },
          { status: 500 }
        )
      }

      conversas = conversasData || []
    } else {
      // Busca normal em conversas (nome, telefone, última mensagem)
      let queryConversas = supabase
        .from('conversas_whatsapp')
        .select(`
          *,
          prospects_academicos (
            id,
            nome,
            nome_completo,
            telefone
          )
        `)
        .or(`nome.ilike.%${query}%,telefone.ilike.%${query}%,ultima_mensagem.ilike.%${query}%`)
        .eq('faculdade_id', faculdade_id) // Sempre filtrar por faculdade
        .limit(limite)

      if (setor) {
        queryConversas = queryConversas.eq('setor', setor)
      }

      if (atendente_id) {
        queryConversas = queryConversas.eq('atendente_id', atendente_id)
      }

      if (status) {
        queryConversas = queryConversas.eq('status_conversa', status)
      }

      if (data_inicio) {
        queryConversas = queryConversas.gte('created_at', data_inicio)
      }

      if (data_fim) {
        queryConversas = queryConversas.lte('created_at', data_fim)
      }

      if (tags && tags.length > 0) {
        queryConversas = queryConversas.contains('tags', tags)
      }

      const { data: conversasData, error: conversasError } = await queryConversas

      if (conversasError) {
        console.error('Erro ao buscar conversas:', conversasError)
        return NextResponse.json(
          { error: getUserFriendlyError(conversasError.message) },
          { status: 500 }
        )
      }

      conversas = conversasData || []
    }

    // Buscar contagem de mensagens para cada conversa
    const conversaIds = conversas.map(c => c.id)
    const { data: mensagensCount } = await supabase
      .from('mensagens')
      .select('conversa_id')
      .in('conversa_id', conversaIds)

    const mensagensPorConversa: Record<string, number> = {}
      ; (mensagensCount || []).forEach((m: any) => {
        mensagensPorConversa[m.conversa_id] = (mensagensPorConversa[m.conversa_id] || 0) + 1
      })

    // Adicionar contagem de mensagens
    const conversasComMensagens = conversas.map(c => ({
      ...c,
      total_mensagens: mensagensPorConversa[c.id] || 0,
    }))

    return NextResponse.json({
      success: true,
      conversas: conversasComMensagens,
      total: conversasComMensagens.length,
      query,
      busca_mensagens,
    })
  } catch (error: any) {
    console.error('Erro ao buscar conversas:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

