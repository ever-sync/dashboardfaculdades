import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { validateData } from '@/lib/schemas'
import { getUserFriendlyError } from '@/lib/errorMessages'
import { validarConversaFaculdade } from '@/lib/faculdadeValidation'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Schema de validação
const atribuirConversaSchema = z.object({
  conversa_id: z.string().uuid('ID de conversa inválido'),
  faculdade_id: z.string().uuid('ID de faculdade inválido'),
  setor: z.string().optional().nullable(),
  atendente_id: z.string().uuid('ID de atendente inválido').optional().nullable()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar dados
    const validation = validateData(atribuirConversaSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { conversa_id, faculdade_id, setor, atendente_id } = validation.data

    // Validar que a conversa pertence à faculdade
    const validacaoConversa = await validarConversaFaculdade(conversa_id, faculdade_id)
    if (!validacaoConversa.valido) {
      return NextResponse.json(
        { error: validacaoConversa.erro || 'Conversa não pertence à faculdade' },
        { status: 403 }
      )
    }

    // Se atendente_id foi fornecido, verificar se está disponível
    if (atendente_id) {
      const { data: atendente, error: atendenteError } = await supabase
        .from('usuarios')
        .select('id, status, ativo, carga_trabalho_atual, carga_trabalho_maxima, faculdade_id')
        .eq('id', atendente_id)
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

      if (atendente.carga_trabalho_atual >= atendente.carga_trabalho_maxima) {
        return NextResponse.json(
          { error: 'Atendente atingiu o limite de conversas simultâneas' },
          { status: 400 }
        )
      }
    } else {
      // Buscar atendente disponível automaticamente
      const { data: atendenteAuto, error: functionError } = await supabase.rpc(
        'buscar_atendente_disponivel',
        {
          p_faculdade_id: faculdade_id,
          p_setor: setor || null
        }
      )

      if (functionError) {
        // Fallback: buscar manualmente
        let query = supabase
          .from('usuarios')
          .select('id, carga_trabalho_atual, carga_trabalho_maxima')
          .eq('faculdade_id', faculdade_id)
          .eq('ativo', true)
          .eq('status', 'online')
          .order('carga_trabalho_atual', { ascending: true })
          .limit(1)

        if (setor) {
          query = query.eq('setor', setor)
        }

        const { data: atendentes, error: atendentesError } = await query

        if (atendentesError || !atendentes || atendentes.length === 0) {
          return NextResponse.json(
            { error: 'Nenhum atendente disponível no momento' },
            { status: 404 }
          )
        }

        const atendenteSelecionado = atendentes.find(
          a => a.carga_trabalho_atual < a.carga_trabalho_maxima
        )

        if (!atendenteSelecionado) {
          return NextResponse.json(
            { error: 'Todos os atendentes atingiram a carga máxima' },
            { status: 400 }
          )
        }

        // Atualizar conversa
        const { error: updateError } = await supabase
          .from('conversas_whatsapp')
          .update({
            atendente_id: atendenteSelecionado.id,
            atendente: atendenteSelecionado.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversa_id)

        if (updateError) {
          return NextResponse.json(
            { error: getUserFriendlyError(updateError.message) },
            { status: 500 }
          )
        }

        return NextResponse.json({
          sucesso: true,
          atendente_id: atendenteSelecionado.id
        })
      }

      if (!atendenteAuto) {
        return NextResponse.json(
          { error: 'Nenhum atendente disponível no momento' },
          { status: 404 }
        )
      }

      // Atualizar conversa com atendente encontrado
      const { error: updateError } = await supabase
        .from('conversas_whatsapp')
        .update({
          atendente_id: atendenteAuto,
          atendente: atendenteAuto,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversa_id)

      if (updateError) {
        return NextResponse.json(
          { error: getUserFriendlyError(updateError.message) },
          { status: 500 }
        )
      }

      return NextResponse.json({
        sucesso: true,
        atendente_id: atendenteAuto
      })
    }

    // Atribuir ao atendente específico fornecido
    const { error: updateError } = await supabase
      .from('conversas_whatsapp')
      .update({
        atendente_id: atendente_id,
        atendente: atendente_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversa_id)

    if (updateError) {
      return NextResponse.json(
        { error: getUserFriendlyError(updateError.message) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      atendente_id: atendente_id
    })
  } catch (error: any) {
    console.error('Erro ao atribuir conversa:', error)
    return NextResponse.json(
      { error: getUserFriendlyError(error?.message || 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

