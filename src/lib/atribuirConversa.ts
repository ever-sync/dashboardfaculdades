import { supabase } from './supabase'

interface AtribuirConversaOptions {
  conversaId: string
  faculdadeId: string
  setor?: string
  atendenteId?: string
}

/**
 * Atribui uma conversa a um atendente disponível usando round-robin
 * Se atendenteId for fornecido, atribui diretamente
 * Caso contrário, busca automaticamente o melhor atendente
 */
export async function atribuirConversa({
  conversaId,
  faculdadeId,
  setor,
  atendenteId
}: AtribuirConversaOptions): Promise<{ sucesso: boolean; atendenteId?: string; erro?: string }> {
  try {
    let idAtendenteFinal = atendenteId

    // Se não foi fornecido um atendente, buscar automaticamente
    if (!idAtendenteFinal) {
      // Buscar usando a função do banco de dados
      const { data, error: functionError } = await supabase.rpc('buscar_atendente_disponivel', {
        p_faculdade_id: faculdadeId,
        p_setor: setor || null
      })

      if (functionError) {
        console.error('Erro ao buscar atendente disponível:', functionError)
        
        // Fallback: buscar manualmente
        const { data: atendentes, error: atendentesError } = await supabase
          .from('usuarios')
          .select('id, carga_trabalho_atual, carga_trabalho_maxima, setor, status, ativo')
          .eq('faculdade_id', faculdadeId)
          .eq('ativo', true)
          .eq('status', 'online')
          .lt('carga_trabalho_atual', supabase.from('usuarios').select('carga_trabalho_maxima'))
          .order('carga_trabalho_atual', { ascending: true })
          .limit(1)

        if (atendentesError || !atendentes || atendentes.length === 0) {
          return {
            sucesso: false,
            erro: atendentesError?.message || 'Nenhum atendente disponível no momento'
          }
        }

        // Filtrar por setor se fornecido
        const atendentesFiltrados = setor
          ? atendentes.filter(a => a.setor === setor)
          : atendentes

        if (atendentesFiltrados.length === 0) {
          return {
            sucesso: false,
            erro: `Nenhum atendente disponível no setor ${setor}`
          }
        }

        idAtendenteFinal = atendentesFiltrados[0].id
      } else {
        idAtendenteFinal = data
      }
    }

    // Se ainda não encontrou atendente, retornar erro
    if (!idAtendenteFinal) {
      return {
        sucesso: false,
        erro: 'Nenhum atendente disponível no momento'
      }
    }

    // Atribuir conversa ao atendente
    const { error: updateError } = await supabase
      .from('conversas_whatsapp')
      .update({
        atendente_id: idAtendenteFinal,
        atendente: idAtendenteFinal, // Manter compatibilidade com campo antigo
        updated_at: new Date().toISOString()
      })
      .eq('id', conversaId)

    if (updateError) {
      console.error('Erro ao atribuir conversa:', updateError)
      return {
        sucesso: false,
        erro: updateError.message
      }
    }

    return {
      sucesso: true,
      atendenteId: idAtendenteFinal
    }
  } catch (error: any) {
    console.error('Erro inesperado ao atribuir conversa:', error)
    return {
      sucesso: false,
      erro: error?.message || 'Erro desconhecido'
    }
  }
}

/**
 * Busca atendentes disponíveis para um setor específico
 */
export async function buscarAtendentesDisponiveis(
  faculdadeId: string,
  setor?: string
): Promise<{ id: string; nome: string; carga: number; max: number }[]> {
  try {
    let query = supabase
      .from('usuarios')
      .select('id, nome, carga_trabalho_atual, carga_trabalho_maxima, setor, status')
      .eq('faculdade_id', faculdadeId)
      .eq('ativo', true)
      .eq('status', 'online')

    if (setor) {
      query = query.eq('setor', setor)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar atendentes:', error)
      return []
    }

    return (data || []).map(atendente => ({
      id: atendente.id,
      nome: atendente.nome,
      carga: atendente.carga_trabalho_atual,
      max: atendente.carga_trabalho_maxima
    }))
  } catch (error: any) {
    console.error('Erro inesperado ao buscar atendentes:', error)
    return []
  }
}

