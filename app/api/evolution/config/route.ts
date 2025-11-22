import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin

// Schema de validação para configuração
const configSchema = z.object({
  evolution_api_url: z.string().url('URL inválida').optional().nullable(),
  evolution_api_key: z.string().min(1, 'Chave de API é obrigatória').optional().nullable(),
})

/**
 * GET - Buscar configurações globais da Evolution API
 */
export async function GET(request: NextRequest) {
  try {
    const { data: configUrl, error: errorUrl } = await supabase
      .from('configuracoes_globais')
      .select('*')
      .eq('chave', 'evolution_api_url')
      .maybeSingle()

    const { data: configKey, error: errorKey } = await supabase
      .from('configuracoes_globais')
      .select('*')
      .eq('chave', 'evolution_api_key')
      .maybeSingle()

    // Verificar se houve erro real (não apenas "não encontrado")
    if (errorUrl && errorUrl.code !== 'PGRST116') {
      throw errorUrl
    }
    if (errorKey && errorKey.code !== 'PGRST116') {
      throw errorKey
    }

    return NextResponse.json({
      evolution_api_url: configUrl?.valor || null,
      evolution_api_key: configKey?.valor ? '***' : null, // Não expor a chave completa
      has_api_key: !!configKey?.valor,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: getUserFriendlyError(error) },
      { status: 500 }
    )
  }
}

/**
 * POST/PUT - Salvar ou atualizar configurações globais da Evolution API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validation = configSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { 
          error: firstError?.message || 'Erro de validação',
          details: `Campo inválido: ${firstError?.path?.join('.') || 'desconhecido'}`,
          issues: validation.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    const { evolution_api_url, evolution_api_key } = validation.data

    // Atualizar ou criar configuração de URL
    if (evolution_api_url !== undefined) {
      const { error: errorUrl } = await supabase
        .from('configuracoes_globais')
        .upsert({
          chave: 'evolution_api_url',
          valor: evolution_api_url || null,
          descricao: 'URL da API Evolution (compartilhada por todas as faculdades)',
          tipo: 'texto',
          sensivel: false,
        }, {
          onConflict: 'chave',
        })

      if (errorUrl) {
        throw errorUrl
      }
    }

    // Atualizar ou criar configuração de API Key
    if (evolution_api_key !== undefined) {
      const { error: errorKey } = await supabase
        .from('configuracoes_globais')
        .upsert({
          chave: 'evolution_api_key',
          valor: evolution_api_key || null,
          descricao: 'Chave de API Evolution (compartilhada por todas as faculdades)',
          tipo: 'texto',
          sensivel: true,
        }, {
          onConflict: 'chave',
        })

      if (errorKey) {
        throw errorKey
      }
    }

    // Testar conexão se ambas as configurações foram fornecidas
    if (evolution_api_url && evolution_api_key) {
      try {
        const testResponse = await fetch(`${evolution_api_url}/instance/fetchInstances`, {
          method: 'GET',
          headers: {
            'apikey': evolution_api_key,
          },
        })

        if (!testResponse.ok) {
          return NextResponse.json(
            { 
              error: 'Não foi possível conectar com a Evolution API. Verifique a URL e a chave.',
              warning: true 
            },
            { status: 400 }
          )
        }
      } catch (testError) {
        return NextResponse.json(
          { 
            error: 'Erro ao testar conexão com a Evolution API. Verifique se a URL está correta.',
            warning: true 
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: getUserFriendlyError(error) },
      { status: 500 }
    )
  }
}

/**
 * PUT - Alias para POST
 */
export async function PUT(request: NextRequest) {
  return POST(request)
}

