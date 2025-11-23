import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'
import { validarConversaFaculdade } from '@/lib/faculdadeValidation'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin

// Schema de validação
const reabrirConversaSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
  faculdade_id: z.string().uuid('ID de faculdade inválido'),
})

// POST - Reabrir conversa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validation = reabrirConversaSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: getUserFriendlyError(validation.error.issues[0]?.message || 'Erro de validação') },
        { status: 400 }
      )
    }

    const { conversa_id, faculdade_id } = validation.data

    // Validar que a conversa pertence à faculdade
    const validacao = await validarConversaFaculdade(conversa_id, faculdade_id)
    if (!validacao.valido) {
      return NextResponse.json(
        { error: validacao.erro || 'Conversa não pertence à faculdade' },
        { status: 403 }
      )
    }

    // Atualizar status da conversa para 'ativa'
    const updateData = {
      status_conversa: 'ativa',
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await (supabase
      .from('conversas_whatsapp') as any)
      .update(updateData as any)
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

