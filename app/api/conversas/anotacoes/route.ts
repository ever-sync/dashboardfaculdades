import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Schema de validação para POST (criar)
const criarAnotacaoSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
  texto: z.string().min(1, 'Texto da anotação é obrigatório').max(2000, 'Anotação muito longa'),
  autor: z.string().min(1, 'Nome do autor é obrigatório'),
  autor_id: z.string().uuid('ID do autor inválido').optional(),
})

// Schema de validação para PUT (editar)
const editarAnotacaoSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
  anotacao_id: z.string().uuid('ID de anotação inválido'),
  texto: z.string().min(1, 'Texto da anotação é obrigatório').max(2000, 'Anotação muito longa'),
})

// Schema de validação para DELETE
const deletarAnotacaoSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
  anotacao_id: z.string().uuid('ID de anotação inválido'),
})

// GET - Buscar anotações
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversaId = searchParams.get('conversa_id')

    if (!conversaId) {
      return NextResponse.json(
        { error: 'ID de conversa é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar conversa e suas anotações
    const { data: conversa, error: conversaError } = await supabase
      .from('conversas_whatsapp')
      .select('anotacoes')
      .eq('id', conversaId)
      .single()

    if (conversaError || !conversa) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    // Converter JSONB para array
    const anotacoes = Array.isArray(conversa.anotacoes) ? conversa.anotacoes : []

    return NextResponse.json({
      success: true,
      anotacoes,
    })
  } catch (error: any) {
    console.error('Erro ao buscar anotações:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

// POST - Criar anotação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validation = criarAnotacaoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: getUserFriendlyError(validation.error.errors[0].message) },
        { status: 400 }
      )
    }

    const { conversa_id, texto, autor, autor_id } = validation.data

    // Buscar anotações atuais
    const { data: conversa, error: conversaError } = await supabase
      .from('conversas_whatsapp')
      .select('anotacoes')
      .eq('id', conversa_id)
      .single()

    if (conversaError || !conversa) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    // Criar nova anotação
    const novaAnotacao = {
      id: crypto.randomUUID(),
      autor,
      autor_id: autor_id || null,
      texto,
      timestamp: new Date().toISOString(),
    }

    // Adicionar à lista de anotações
    const anotacoesAtuais = Array.isArray(conversa.anotacoes) ? conversa.anotacoes : []
    const novasAnotacoes = [...anotacoesAtuais, novaAnotacao]

    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('conversas_whatsapp')
      .update({
        anotacoes: novasAnotacoes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversa_id)

    if (updateError) {
      console.error('Erro ao criar anotação:', updateError)
      return NextResponse.json(
        { error: getUserFriendlyError(updateError.message) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Anotação criada com sucesso',
      anotacao: novaAnotacao,
    })
  } catch (error: any) {
    console.error('Erro ao criar anotação:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

// PUT - Editar anotação
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validation = editarAnotacaoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: getUserFriendlyError(validation.error.errors[0].message) },
        { status: 400 }
      )
    }

    const { conversa_id, anotacao_id, texto } = validation.data

    // Buscar anotações atuais
    const { data: conversa, error: conversaError } = await supabase
      .from('conversas_whatsapp')
      .select('anotacoes')
      .eq('id', conversa_id)
      .single()

    if (conversaError || !conversa) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar anotação
    const anotacoesAtuais = Array.isArray(conversa.anotacoes) ? conversa.anotacoes : []
    const anotacaoIndex = anotacoesAtuais.findIndex((a: any) => a.id === anotacao_id)

    if (anotacaoIndex === -1) {
      return NextResponse.json(
        { error: 'Anotação não encontrada' },
        { status: 404 }
      )
    }

    const anotacaoAtualizada = {
      ...anotacoesAtuais[anotacaoIndex],
      texto,
      editado_em: new Date().toISOString(),
    }

    const novasAnotacoes = [...anotacoesAtuais]
    novasAnotacoes[anotacaoIndex] = anotacaoAtualizada

    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('conversas_whatsapp')
      .update({
        anotacoes: novasAnotacoes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversa_id)

    if (updateError) {
      console.error('Erro ao editar anotação:', updateError)
      return NextResponse.json(
        { error: getUserFriendlyError(updateError.message) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Anotação atualizada com sucesso',
      anotacao: anotacaoAtualizada,
    })
  } catch (error: any) {
    console.error('Erro ao editar anotação:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

// DELETE - Excluir anotação
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validation = deletarAnotacaoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: getUserFriendlyError(validation.error.errors[0].message) },
        { status: 400 }
      )
    }

    const { conversa_id, anotacao_id } = validation.data

    // Buscar anotações atuais
    const { data: conversa, error: conversaError } = await supabase
      .from('conversas_whatsapp')
      .select('anotacoes')
      .eq('id', conversa_id)
      .single()

    if (conversaError || !conversa) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    // Remover anotação
    const anotacoesAtuais = Array.isArray(conversa.anotacoes) ? conversa.anotacoes : []
    const novasAnotacoes = anotacoesAtuais.filter((a: any) => a.id !== anotacao_id)

    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('conversas_whatsapp')
      .update({
        anotacoes: novasAnotacoes.length > 0 ? novasAnotacoes : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversa_id)

    if (updateError) {
      console.error('Erro ao excluir anotação:', updateError)
      return NextResponse.json(
        { error: getUserFriendlyError(updateError.message) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Anotação excluída com sucesso',
    })
  } catch (error: any) {
    console.error('Erro ao excluir anotação:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

