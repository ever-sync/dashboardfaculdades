import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'
import { validarConversaFaculdade } from '@/lib/faculdadeValidation'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin

// Schema de validação
const tagsSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
  faculdade_id: z.string().uuid('ID de faculdade inválido'),
  tags: z.array(z.string()).default([]),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validation = tagsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: getUserFriendlyError(validation.error.issues[0]?.message || 'Erro de validação') },
        { status: 400 }
      )
    }

    const { conversa_id, faculdade_id, tags } = validation.data

    // Validar que a conversa pertence à faculdade
    const validacao = await validarConversaFaculdade(conversa_id, faculdade_id)
    if (!validacao.valido) {
      return NextResponse.json(
        { error: validacao.erro || 'Conversa não pertence à faculdade' },
        { status: 403 }
      )
    }

    // Atualizar tags na conversa
    const updateData = {
      tags: tags.length > 0 ? tags : null, // null se array vazio
      updated_at: new Date().toISOString(),
    }
    const { error: updateError } = await (supabase
      .from('conversas_whatsapp') as any)
      .update(updateData as any)
      .eq('id', conversa_id)

    if (updateError) {
      console.error('Erro ao atualizar tags:', updateError)
      return NextResponse.json(
        { error: getUserFriendlyError(updateError.message) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tags atualizadas com sucesso',
      tags,
    })
  } catch (error: any) {
    console.error('Erro ao atualizar tags:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

