import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'
import { validarConversaFaculdade } from '@/lib/faculdadeValidation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Schema de validação
const transferirConversaSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
  faculdade_id: z.string().uuid('ID de faculdade inválido'),
  setor_origem: z.string().min(1, 'Setor de origem é obrigatório'),
  setor_destino: z.string().optional(),
  atendente_destino: z.string().uuid('ID de atendente inválido').optional(),
  motivo: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validation = transferirConversaSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: getUserFriendlyError(validation.error.issues[0]?.message || 'Erro de validação') },
        { status: 400 }
      )
    }

    const { conversa_id, faculdade_id, setor_origem, setor_destino, atendente_destino, motivo } = validation.data

    // Validar que a conversa pertence à faculdade
    const validacao = await validarConversaFaculdade(conversa_id, faculdade_id)
    if (!validacao.valido) {
      return NextResponse.json(
        { error: validacao.erro || 'Conversa não pertence à faculdade' },
        { status: 403 }
      )
    }

    // Verificar se pelo menos setor_destino ou atendente_destino foi fornecido
    if (!setor_destino && !atendente_destino) {
      return NextResponse.json(
        { error: 'É necessário fornecer setor de destino ou atendente de destino' },
        { status: 400 }
      )
    }

    // Buscar conversa atual
    const { data: conversa, error: conversaError } = await supabase
      .from('conversas_whatsapp')
      .select('*')
      .eq('id', conversa_id)
      .single()

    if (conversaError || !conversa) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    // Se atendente_destino foi fornecido, verificar se existe e está disponível
    let atendenteDestinoNome: string | undefined
    if (atendente_destino) {
      const { data: atendente, error: atendenteError } = await supabase
        .from('usuarios')
        .select('id, nome, status, ativo, faculdade_id')
        .eq('id', atendente_destino)
        .single()

      if (atendenteError || !atendente) {
        return NextResponse.json(
          { error: 'Atendente não encontrado' },
          { status: 404 }
        )
      }

      if (atendente.faculdade_id !== faculdade_id) {
        return NextResponse.json(
          { error: 'Atendente não pertence à faculdade informada' },
          { status: 403 }
        )
      }

      if (!atendente.ativo || atendente.status !== 'online') {
        return NextResponse.json(
          { error: 'Atendente não está disponível' },
          { status: 400 }
        )
      }

      atendenteDestinoNome = atendente.nome
    }

    // Determinar setor de destino final
    const setorDestinoFinal = setor_destino || (atendente_destino ? (await supabase
      .from('usuarios')
      .select('setor')
      .eq('id', atendente_destino)
      .single()).data?.setor : undefined)

    if (!setorDestinoFinal) {
      return NextResponse.json(
        { error: 'Não foi possível determinar o setor de destino' },
        { status: 400 }
      )
    }

    // Atualizar conversa
    const atualizacaoConversa: any = {
      setor: setorDestinoFinal,
      updated_at: new Date().toISOString(),
    }

    // Se atendente foi especificado, atribuir a ele
    if (atendente_destino) {
      atualizacaoConversa.atendente_id = atendente_destino
      atualizacaoConversa.atendente = atendenteDestinoNome || atendente_destino
    } else {
      // Remover atribuição atual para que o setor possa pegar
      atualizacaoConversa.atendente_id = null
      atualizacaoConversa.atendente = null
    }

    const { error: updateError } = await supabase
      .from('conversas_whatsapp')
      .update(atualizacaoConversa)
      .eq('id', conversa_id)

    if (updateError) {
      console.error('Erro ao atualizar conversa:', updateError)
      return NextResponse.json(
        { error: getUserFriendlyError(updateError.message) },
        { status: 500 }
      )
    }

    // Registrar transferência
    const { error: transferError } = await supabase
      .from('transferencias_setores')
      .insert({
        faculdade_id,
        conversa_id,
        setor_origem,
        setor_destino: setorDestinoFinal,
        motivo: motivo || undefined,
        atendente_origem: conversa.atendente || undefined,
        atendente_destino: atendenteDestinoNome || undefined,
        timestamp: new Date().toISOString(),
      })

    if (transferError) {
      console.error('Erro ao registrar transferência:', transferError)
      // Não falhar a transferência se apenas o registro falhar
    }

    // Enviar mensagem automática informando transferência
    const mensagemTransferencia = `🔄 Conversa transferida para ${setorDestinoFinal}${atendenteDestinoNome ? ` (Atendente: ${atendenteDestinoNome})` : ''}. ${motivo ? `Motivo: ${motivo}` : ''}`

    try {
      await supabase
        .from('mensagens')
        .insert({
          conversa_id,
          conteudo: mensagemTransferencia,
          remetente: 'agente',
          tipo_mensagem: 'texto',
          timestamp: new Date().toISOString(),
          lida: false,
        })
    } catch (messageError) {
      console.error('Erro ao enviar mensagem de transferência:', messageError)
      // Não falhar a transferência se apenas a mensagem falhar
    }

    return NextResponse.json({
      success: true,
      message: 'Conversa transferida com sucesso',
      setor_destino: setorDestinoFinal,
      atendente_destino: atendenteDestinoNome || undefined,
    })
  } catch (error: any) {
    console.error('Erro ao transferir conversa:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

