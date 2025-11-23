import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'
import { validarConversaFaculdade } from '@/lib/faculdadeValidation'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin

// Schema de validação
const marcarLidaSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
  faculdade_id: z.string().uuid('ID de faculdade inválido'),
  marcar_mensagens_especificas: z.array(z.string().uuid()).optional(), // IDs de mensagens específicas para marcar
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validation = marcarLidaSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: getUserFriendlyError(validation.error.issues[0]?.message || 'Erro de validação') },
        { status: 400 }
      )
    }

    const { conversa_id, faculdade_id, marcar_mensagens_especificas } = validation.data

    // Validar que a conversa pertence à faculdade
    const validacao = await validarConversaFaculdade(conversa_id, faculdade_id)
    if (!validacao.valido) {
      return NextResponse.json(
        { error: validacao.erro || 'Conversa não pertence à faculdade' },
        { status: 403 }
      )
    }

    // Verificar se a conversa existe
    const { data: conversa, error: conversaError } = await supabase
      .from('conversas_whatsapp')
      .select('id, nao_lidas')
      .eq('id', conversa_id)
      .single()

    if (conversaError || !conversa) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    // Se mensagens específicas foram fornecidas, marcar apenas elas
    if (marcar_mensagens_especificas && marcar_mensagens_especificas.length > 0) {
      // Marcar mensagens específicas como lidas
      const { error: updateMensagensError } = await (supabase
        .from('mensagens') as any)
        .update({ lida: true } as any)
        .in('id', marcar_mensagens_especificas)
        .eq('conversa_id', conversa_id)

      if (updateMensagensError) {
        console.error('Erro ao marcar mensagens como lidas:', updateMensagensError)
        return NextResponse.json(
          { error: getUserFriendlyError(updateMensagensError.message) },
          { status: 500 }
        )
      }

      // Contar mensagens não lidas restantes
      const { count, error: countError } = await supabase
        .from('mensagens')
        .select('*', { count: 'exact', head: true })
        .eq('conversa_id', conversa_id)
        .eq('lida', false)

      const nao_lidas = countError ? conversa.nao_lidas || 0 : (count || 0)

      // Atualizar contador na conversa
      const updateData = {
        nao_lidas: nao_lidas,
        updated_at: new Date().toISOString(),
      }
      const { error: updateConversaError } = await (supabase
        .from('conversas_whatsapp') as any)
        .update(updateData as any)
        .eq('id', conversa_id)

      if (updateConversaError) {
        console.error('Erro ao atualizar contador de não lidas:', updateConversaError)
      }

      return NextResponse.json({
        success: true,
        message: 'Mensagens marcadas como lidas',
        nao_lidas,
      })
    }

    // Caso contrário, marcar TODAS as mensagens da conversa como lidas
    const { error: updateAllMensagensError } = await (supabase
      .from('mensagens') as any)
      .update({ lida: true } as any)
      .eq('conversa_id', conversa_id)
      .eq('lida', false)

    if (updateAllMensagensError) {
      console.error('Erro ao marcar todas as mensagens como lidas:', updateAllMensagensError)
      return NextResponse.json(
        { error: getUserFriendlyError(updateAllMensagensError.message) },
        { status: 500 }
      )
    }

    // Atualizar contador na conversa para 0
    const updateData = {
      nao_lidas: 0,
      updated_at: new Date().toISOString(),
    }
    const { error: updateConversaError } = await (supabase
      .from('conversas_whatsapp') as any)
      .update(updateData as any)
      .eq('id', conversa_id)

    if (updateConversaError) {
      console.error('Erro ao atualizar contador de não lidas:', updateConversaError)
      return NextResponse.json(
        { error: getUserFriendlyError(updateConversaError.message) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Conversa marcada como lida',
      nao_lidas: 0,
    })
  } catch (error: any) {
    console.error('Erro ao marcar conversa como lida:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

