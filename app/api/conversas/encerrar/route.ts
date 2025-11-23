import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateData } from '@/lib/schemas'
import { getUserFriendlyError } from '@/lib/errorMessages'
import { validarConversaFaculdade } from '@/lib/faculdadeValidation'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin

// Schema de validação
const encerrarConversaSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
  faculdade_id: z.string().uuid('ID de faculdade inválido'),
})

// POST - Encerrar conversa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar dados
    const validation = validateData(encerrarConversaSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
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

    // Atualizar status da conversa para 'encerrada'
    const updateData = {
      status_conversa: 'encerrada',
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await (supabase
      .from('conversas_whatsapp') as any)
      .update(updateData as any)
      .eq('id', conversa_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao encerrar conversa:', error)
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
      message: 'Conversa encerrada com sucesso',
      conversa: data,
    })
  } catch (error: any) {
    console.error('Erro ao encerrar conversa:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

