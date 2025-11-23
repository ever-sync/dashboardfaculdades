import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin

/**
 * Endpoint para processar mensagens agendadas pendentes
 * Este endpoint deve ser chamado por um cron job ou worker periodicamente (ex: a cada minuto)
 */
export async function POST(request: NextRequest) {
  try {
    const agora = new Date()
    const limiteTentativas = 3

    // Buscar mensagens agendadas pendentes cuja data de agendamento já passou
    const { data: mensagensPendentes, error: fetchError } = await supabase
      .from('mensagens_agendadas')
      .select('*')
      .eq('status', 'pendente')
      .lte('data_agendamento', agora.toISOString())
      .lt('tentativas', limiteTentativas)
      .order('data_agendamento', { ascending: true })
      .limit(50) // Processar no máximo 50 por vez

    if (fetchError) {
      console.error('Erro ao buscar mensagens agendadas:', fetchError)
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      )
    }

    if (!mensagensPendentes || mensagensPendentes.length === 0) {
      return NextResponse.json({
        success: true,
        processadas: 0,
        enviadas: 0,
        falhas: 0,
        mensagens: [],
      })
    }

    const resultados = {
      enviadas: 0,
      falhas: 0,
      mensagens: [] as any[],
    }

    // Processar cada mensagem
    for (const mensagem of mensagensPendentes) {
      try {
        // Tentar enviar via WhatsApp
        const sendResponse = await fetch(`${request.nextUrl.origin}/api/whatsapp/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversa_id: mensagem.conversa_id || undefined,
            telefone: mensagem.telefone,
            conteudo: mensagem.conteudo,
            remetente: mensagem.remetente,
            tipo_mensagem: mensagem.tipo_mensagem,
          }),
        })

        const sendData = await sendResponse.json()

        if (sendResponse.ok && sendData.success) {
          // Atualizar status para "enviada"
          const updateData = {
            status: 'enviada',
            enviada_em: agora.toISOString(),
            tentativas: mensagem.tentativas + 1,
          }
          await (supabase
            .from('mensagens_agendadas') as any)
            .update(updateData as any)
            .eq('id', mensagem.id)

          resultados.enviadas++
          resultados.mensagens.push({
            id: mensagem.id,
            status: 'enviada',
            enviada_em: agora.toISOString(),
          })
        } else {
          // Incrementar tentativas
          const novasTentativas = mensagem.tentativas + 1
          const novoStatus = novasTentativas >= limiteTentativas ? 'falha' : 'pendente'

          const updateData = {
            status: novoStatus,
            tentativas: novasTentativas,
            erro_mensagem: sendData.error || 'Erro ao enviar mensagem',
          }
          await (supabase
            .from('mensagens_agendadas') as any)
            .update(updateData as any)
            .eq('id', mensagem.id)

          resultados.falhas++
          resultados.mensagens.push({
            id: mensagem.id,
            status: novoStatus,
            erro: sendData.error || 'Erro ao enviar mensagem',
          })
        }
      } catch (error: any) {
        console.error(`Erro ao processar mensagem ${mensagem.id}:`, error)
        
        // Incrementar tentativas
        const novasTentativas = mensagem.tentativas + 1
        const novoStatus = novasTentativas >= limiteTentativas ? 'falha' : 'pendente'

        const updateData = {
          status: novoStatus,
          tentativas: novasTentativas,
          erro_mensagem: error.message || 'Erro desconhecido',
        }
        await (supabase
          .from('mensagens_agendadas') as any)
          .update(updateData as any)
          .eq('id', mensagem.id)

        resultados.falhas++
        resultados.mensagens.push({
          id: mensagem.id,
          status: novoStatus,
          erro: error.message || 'Erro desconhecido',
        })
      }
    }

    return NextResponse.json({
      success: true,
      processadas: mensagensPendentes.length,
      enviadas: resultados.enviadas,
      falhas: resultados.falhas,
      mensagens: resultados.mensagens,
    })
  } catch (error: any) {
    console.error('Erro ao processar mensagens agendadas:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

