import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin

// GET - Buscar faculdade por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('faculdades')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: 'Faculdade não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar faculdade:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar faculdade' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar faculdade
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nome, cnpj, telefone, email, endereco, cidade, estado, plano, status } = body

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (nome !== undefined) updateData.nome = nome
    if (cnpj !== undefined) updateData.cnpj = cnpj
    if (telefone !== undefined) updateData.telefone = telefone
    if (email !== undefined) updateData.email = email
    if (endereco !== undefined) updateData.endereco = endereco
    if (cidade !== undefined) updateData.cidade = cidade
    if (estado !== undefined) updateData.estado = estado
    if (plano !== undefined) updateData.plano = plano
    if (status !== undefined) updateData.status = status

    const { data, error } = await supabase
      .from('faculdades')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: 'Faculdade não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Erro ao atualizar faculdade:', error)
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'CNPJ já cadastrado' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar faculdade' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar faculdade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabase
      .from('faculdades')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Faculdade deletada com sucesso' })
  } catch (error: any) {
    console.error('Erro ao deletar faculdade:', error)
    
    if (error.code === '23503') {
      return NextResponse.json(
        { error: 'Não é possível deletar faculdade com dados relacionados' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao deletar faculdade' },
      { status: 500 }
    )
  }
}

