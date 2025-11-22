import { NextRequest, NextResponse } from 'next/server'
import { createFaculdadeSchema, validateData } from '@/lib/schemas'
import { getUserFriendlyError } from '@/lib/errorMessages'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin

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
    // Log erro em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao buscar faculdades:', error)
    }

    return NextResponse.json(
      { error: getUserFriendlyError(error) },
      { status: 500 }
    )
  }
}

// POST - Criar nova faculdade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar dados de entrada
    const validation = validateData(createFaculdadeSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('faculdades')
      .insert(validation.data)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    // Log erro em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao criar faculdade:', error)
    }

    return NextResponse.json(
      { error: getUserFriendlyError(error) },
      { status: error.code === '23505' ? 409 : 500 }
    )
  }
}
