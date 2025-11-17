import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Schema de validação
const reabrirConversaSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
})

// POST - Reabrir conversa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validation = reabrirConversaSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: getUserFriendlyError(validation.error.errors[0].message) },
        { status: 400 }
      )
    }

    const { conversa_id } = validation.data

    // Atualizar status da conversa para 'ativa'
    const { data, error } = await supabase
      .from('conversas_whatsapp')
      .update({
        status_conversa: 'ativa',
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversa_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao reabrir conversa:', error)
      return NextResponse.json(
        { error: getUserFriendlyError(error.message) },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Conversa reaberta com sucesso',
      conversa: data,
    })
  } catch (error: any) {
    console.error('Erro ao reabrir conversa:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

