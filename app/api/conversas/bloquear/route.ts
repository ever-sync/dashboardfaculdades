import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Schema de validação para bloquear
const bloquearConversaSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
  motivo: z.string().max(500, 'Motivo muito longo').optional(),
})

// Schema de validação para desbloquear
const desbloquearConversaSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'bloquear' // bloquear ou desbloquear

    if (action === 'bloquear') {
      // Validar dados para bloquear
      const validation = bloquearConversaSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: getUserFriendlyError(validation.error.issues[0]?.message || 'Erro de validação') },
          { status: 400 }
        )
      }

      const { conversa_id, motivo } = validation.data

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

      // Bloquear conversa
      const { error: updateError } = await supabase
        .from('conversas_whatsapp')
        .update({
          bloqueado: true,
          motivo_bloqueio: motivo || null,
          data_bloqueio: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversa_id)

      if (updateError) {
        console.error('Erro ao bloquear conversa:', updateError)
        return NextResponse.json(
          { error: getUserFriendlyError(updateError.message) },
          { status: 500 }
        )
      }

      // Inserir mensagem de sistema informando bloqueio
      const { error: mensagemError } = await supabase
        .from('mensagens')
        .insert({
          conversa_id,
          conteudo: `🔒 Contato bloqueado${motivo ? `: ${motivo}` : ''}`,
          remetente: 'sistema',
          tipo_mensagem: 'sistema',
          timestamp: new Date().toISOString(),
        })

      if (mensagemError) {
        console.error('Erro ao criar mensagem de sistema:', mensagemError)
        // Não falhar se não conseguir criar a mensagem
      }

      return NextResponse.json({
        success: true,
        message: 'Conversa bloqueada com sucesso',
      })
    } else if (action === 'desbloquear') {
      // Validar dados para desbloquear
      const validation = desbloquearConversaSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: getUserFriendlyError(validation.error.issues[0]?.message || 'Erro de validação') },
          { status: 400 }
        )
      }

      const { conversa_id } = validation.data

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

      // Desbloquear conversa
      const { error: updateError } = await supabase
        .from('conversas_whatsapp')
        .update({
          bloqueado: false,
          motivo_bloqueio: null,
          data_bloqueio: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversa_id)

      if (updateError) {
        console.error('Erro ao desbloquear conversa:', updateError)
        return NextResponse.json(
          { error: getUserFriendlyError(updateError.message) },
          { status: 500 }
        )
      }

      // Inserir mensagem de sistema informando desbloqueio
      const { error: mensagemError } = await supabase
        .from('mensagens')
        .insert({
          conversa_id,
          conteudo: '🔓 Contato desbloqueado',
          remetente: 'sistema',
          tipo_mensagem: 'sistema',
          timestamp: new Date().toISOString(),
        })

      if (mensagemError) {
        console.error('Erro ao criar mensagem de sistema:', mensagemError)
        // Não falhar se não conseguir criar a mensagem
      }

      return NextResponse.json({
        success: true,
        message: 'Conversa desbloqueada com sucesso',
      })
    } else {
      return NextResponse.json(
        { error: 'Ação inválida. Use ?action=bloquear ou ?action=desbloquear' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Erro ao bloquear/desbloquear conversa:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

