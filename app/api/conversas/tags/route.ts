import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Schema de validação
const tagsSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
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

    const { conversa_id, tags } = validation.data

    // Verificar se a conversa existe
    const { data: conversa, error: conversaError } = await supabase
      .from('conversas_whatsapp')
      .select('id')
      .eq('id', conversa_id)
      .single()

    if (conversaError || !conversa) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar tags na conversa
    const { error: updateError } = await supabase
      .from('conversas_whatsapp')
      .update({
        tags: tags.length > 0 ? tags : null, // null se array vazio
        updated_at: new Date().toISOString(),
      })
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

