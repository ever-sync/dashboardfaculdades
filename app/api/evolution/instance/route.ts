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
    const { searchParams } = new URL(request.url)
    const faculdadeId = searchParams.get('faculdade_id')

    if (!faculdadeId) {
      return NextResponse.json(
        { error: 'faculdade_id é obrigatório' },
        { status: 400 }
      )
    }

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
        const qrResponse = await fetch(`${apiUrl}/instance/connect/${faculdade.evolution_instance}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
          },
        })

        if (qrResponse.ok) {
          const qrData = await qrResponse.json()
          if (qrData.qrcode) {
            qrCode = qrData.qrcode.base64 || qrData.qrcode
            // QR code geralmente expira em 40 segundos
            qrExpiresAt = new Date(Date.now() + 40 * 1000).toISOString()

            // Atualizar no banco
            await supabase
              .from('faculdades')
              .update({
                evolution_qr_code: qrCode,
                evolution_qr_expires_at: qrExpiresAt,
                evolution_status: 'conectando',
              })
              .eq('id', faculdadeId)
          }
        }
      } catch (error) {
        console.warn('Erro ao buscar QR code:', error)
      }
    }

    // Verificar status da instância
    try {
      const statusResponse = await fetch(`${apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
      })

      if (statusResponse.ok) {
        const instances = await statusResponse.json()
        const instance = Array.isArray(instances) 
          ? instances.find((inst: any) => inst.instance?.instanceName === faculdade.evolution_instance)
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
    const body = await request.json()
    
    const validation = createInstanceSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Erro de validação' },
        { status: 400 }
      )
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
        }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}))
        return NextResponse.json(
          { error: errorData.message || `Erro ao criar instância: ${createResponse.statusText}` },
          { status: createResponse.status }
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
    const { searchParams } = new URL(request.url)
    const faculdadeId = searchParams.get('faculdade_id')

    if (!faculdadeId) {
      return NextResponse.json(
        { error: 'faculdade_id é obrigatório' },
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

