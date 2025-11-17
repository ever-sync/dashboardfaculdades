import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Schema de validação
const marcarLidaSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
  marcar_mensagens_especificas: z.array(z.string().uuid()).optional(), // IDs de mensagens específicas para marcar
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validation = marcarLidaSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: getUserFriendlyError(validation.error.errors[0].message) },
        { status: 400 }
      )
    }

    const { conversa_id, marcar_mensagens_especificas } = validation.data

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
      const { error: updateMensagensError } = await supabase
        .from('mensagens')
        .update({ lida: true })
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
      const { error: updateConversaError } = await supabase
        .from('conversas_whatsapp')
        .update({
          nao_lidas: nao_lidas,
          updated_at: new Date().toISOString(),
        })
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
    const { error: updateAllMensagensError } = await supabase
      .from('mensagens')
      .update({ lida: true })
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
    const { error: updateConversaError } = await supabase
      .from('conversas_whatsapp')
      .update({
        nao_lidas: 0,
        updated_at: new Date().toISOString(),
      })
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

