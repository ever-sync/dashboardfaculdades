import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Schema de validação
const configSchema = z.object({
  chave: z.string().min(1, 'Chave é obrigatória'),
  valor: z.string().optional().nullable(),
  descricao: z.string().optional(),
  tipo: z.enum(['texto', 'json', 'boolean', 'number']).optional().default('texto'),
  sensivel: z.boolean().optional().default(false),
})

/**
 * GET - Buscar configuração global
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      )
    }
    const { searchParams } = new URL(request.url)
    const chave = searchParams.get('chave')

    if (chave) {
      // Buscar configuração específica
      const { data, error } = await supabase
        .from('configuracoes_globais')
        .select('chave, valor, descricao, tipo, sensivel')
        .eq('chave', chave)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: 'Configuração não encontrada' },
          { status: 404 }
        )
      }

      // Se for sensível, não retornar o valor
      if (data.sensivel) {
        return NextResponse.json({
          chave: data.chave,
          descricao: data.descricao,
          tipo: data.tipo,
          sensivel: true,
          valor: '***' // Não expor valor sensível
        })
      }

      return NextResponse.json(data)
    } else {
      // Buscar todas as configurações (sem valores sensíveis)
      const { data, error } = await supabase
        .from('configuracoes_globais')
        .select('chave, valor, descricao, tipo, sensivel')
        .order('chave')

      if (error) throw error

      // Ocultar valores sensíveis
      const configs = (data || []).map(config => ({
        ...config,
        valor: config.sensivel ? '***' : config.valor
      }))

      return NextResponse.json({ configuracoes: configs })
    }
  } catch (error: any) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

/**
 * POST - Criar ou atualizar configuração global
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      )
    }
    const body = await request.json()
    
    const validation = configSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Erro de validação' },
        { status: 400 }
      )
    }

    const { chave, valor, descricao, tipo, sensivel } = validation.data

    // Upsert (criar ou atualizar)
    const { data, error } = await supabase
      .from('configuracoes_globais')
      .upsert({
        chave,
        valor: valor || null,
        descricao: descricao || null,
        tipo: tipo || 'texto',
        sensivel: sensivel || false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'chave',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      configuracao: data,
      message: 'Configuração salva com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao salvar configuração:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

