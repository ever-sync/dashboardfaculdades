import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Listar todas as faculdades
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const plano = searchParams.get('plano')

    let query = supabase
      .from('faculdades')
      .select('*')
      .order('nome')

    if (status) {
      query = query.eq('status', status)
    }

    if (plano) {
      query = query.eq('plano', plano)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Erro ao buscar faculdades:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar faculdades' },
      { status: 500 }
    )
  }
}

// POST - Criar nova faculdade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, cnpj, telefone, email, endereco, cidade, estado, plano, status } = body

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('faculdades')
      .insert({
        nome,
        cnpj,
        telefone,
        email,
        endereco,
        cidade,
        estado,
        plano: plano || 'basico',
        status: status || 'ativo',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar faculdade:', error)
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'CNPJ já cadastrado' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao criar faculdade' },
      { status: 500 }
    )
  }
}

