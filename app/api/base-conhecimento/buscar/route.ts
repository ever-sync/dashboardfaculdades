import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Schema de validação
const buscarBaseSchema = z.object({
  query: z.string().min(1, 'Query é obrigatória').max(500, 'Query muito longa'),
  faculdade_id: z.string().uuid('ID de faculdade inválido').optional(),
  categoria: z.string().optional(),
  limite: z.number().int().min(1).max(20).optional().default(5),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('query') || ''
    const faculdadeId = searchParams.get('faculdade_id')
    const categoria = searchParams.get('categoria')
    const limite = parseInt(searchParams.get('limite') || '5')

    // Validar dados
    const validation = buscarBaseSchema.safeParse({
      query,
      faculdade_id: faculdadeId || undefined,
      categoria: categoria || undefined,
      limite,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: getUserFriendlyError(validation.error.issues[0]?.message || 'Erro de validação') },
        { status: 400 }
      )
    }

    const { query: queryValidada, faculdade_id, categoria: categoriaValidada, limite: limiteValidado } = validation.data

    // Buscar na base de conhecimento usando busca full-text
    let querySupabase = supabase
      .from('base_conhecimento')
      .select('id, pergunta, resposta, categoria, tags, visualizacoes, util, nao_util')
      .eq('ativo', true)
      .limit(limiteValidado)

    // Filtrar por faculdade se fornecido
    if (faculdade_id) {
      querySupabase = querySupabase.eq('faculdade_id', faculdade_id)
    }

    // Filtrar por categoria se fornecido
    if (categoriaValidada) {
      querySupabase = querySupabase.eq('categoria', categoriaValidada)
    }

    // Busca full-text nas perguntas e respostas
    // O PostgreSQL com tsvector suporta busca mais eficiente
    // Por enquanto, vamos fazer busca simples com ILIKE
    const { data: resultados, error: searchError } = await querySupabase

    if (searchError) {
      console.error('Erro ao buscar base de conhecimento:', searchError)
      return NextResponse.json(
        { error: getUserFriendlyError(searchError.message) },
        { status: 500 }
      )
    }

    // Filtrar resultados por relevância (busca simples por palavras-chave)
    const palavrasChave = queryValidada.toLowerCase().split(/\s+/).filter(p => p.length > 2)
    
    const resultadosRelevantes = (resultados || [])
      .map((item: any) => {
        const textoCompleto = `${item.pergunta} ${item.resposta}`.toLowerCase()
        const relevancia = palavrasChave.reduce((score, palavra) => {
          const ocorrencias = (textoCompleto.match(new RegExp(palavra, 'g')) || []).length
          return score + ocorrencias
        }, 0)

        return {
          ...item,
          relevancia,
        }
      })
      .filter((item: any) => item.relevancia > 0)
      .sort((a: any, b: any) => b.relevancia - a.relevancia)
      .slice(0, limiteValidado)
      .map(({ relevancia, ...item }: any) => item) // Remover relevancia do resultado final

    return NextResponse.json({
      success: true,
      resultados: resultadosRelevantes,
      total: resultadosRelevantes.length,
      query: queryValidada,
    })
  } catch (error: any) {
    console.error('Erro ao buscar base de conhecimento:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

