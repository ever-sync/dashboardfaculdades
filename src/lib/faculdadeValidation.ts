/**
 * Funções helper para validação de isolamento por faculdade
 * Garante que recursos pertencem à faculdade correta
 */

import { supabaseAdmin } from '@/lib/supabase-admin'

const supabase = supabaseAdmin

/**
 * Valida se uma conversa pertence à faculdade especificada
 */
export async function validarConversaFaculdade(
  conversaId: string,
  faculdadeId: string
): Promise<{ valido: boolean; erro?: string }> {
  try {
    const { data: conversa, error } = await supabase
      .from('conversas_whatsapp')
      .select('faculdade_id')
      .eq('id', conversaId)
      .single()

    if (error || !conversa) {
      return { valido: false, erro: 'Conversa não encontrada' }
    }

    if (conversa.faculdade_id !== faculdadeId) {
      return { valido: false, erro: 'Conversa não pertence à faculdade especificada' }
    }

    return { valido: true }
  } catch (error: any) {
    return { valido: false, erro: error.message || 'Erro ao validar conversa' }
  }
}

/**
 * Valida se um atendente pertence à faculdade especificada
 */
export async function validarAtendenteFaculdade(
  atendenteId: string,
  faculdadeId: string
): Promise<{ valido: boolean; erro?: string }> {
  try {
    const { data: atendente, error } = await supabase
      .from('usuarios')
      .select('faculdade_id')
      .eq('id', atendenteId)
      .single()

    if (error || !atendente) {
      return { valido: false, erro: 'Atendente não encontrado' }
    }

    if (atendente.faculdade_id !== faculdadeId) {
      return { valido: false, erro: 'Atendente não pertence à faculdade especificada' }
    }

    return { valido: true }
  } catch (error: any) {
    return { valido: false, erro: error.message || 'Erro ao validar atendente' }
  }
}

/**
 * Valida se uma mensagem agendada pertence à faculdade especificada
 */
export async function validarMensagemAgendadaFaculdade(
  mensagemId: string,
  faculdadeId: string
): Promise<{ valido: boolean; erro?: string }> {
  try {
    const { data: mensagem, error } = await supabase
      .from('mensagens_agendadas')
      .select('faculdade_id')
      .eq('id', mensagemId)
      .single()

    if (error || !mensagem) {
      return { valido: false, erro: 'Mensagem agendada não encontrada' }
    }

    if (mensagem.faculdade_id !== faculdadeId) {
      return { valido: false, erro: 'Mensagem agendada não pertence à faculdade especificada' }
    }

    return { valido: true }
  } catch (error: any) {
    return { valido: false, erro: error.message || 'Erro ao validar mensagem agendada' }
  }
}

/**
 * Valida se um prospect pertence à faculdade especificada
 */
export async function validarProspectFaculdade(
  prospectId: string,
  faculdadeId: string
): Promise<{ valido: boolean; erro?: string }> {
  try {
    const { data: prospect, error } = await supabase
      .from('prospects_academicos')
      .select('faculdade_id')
      .eq('id', prospectId)
      .single()

    if (error || !prospect) {
      return { valido: false, erro: 'Prospect não encontrado' }
    }

    if (prospect.faculdade_id !== faculdadeId) {
      return { valido: false, erro: 'Prospect não pertence à faculdade especificada' }
    }

    return { valido: true }
  } catch (error: any) {
    return { valido: false, erro: error.message || 'Erro ao validar prospect' }
  }
}

/**
 * Valida se um curso pertence à faculdade especificada
 */
export async function validarCursoFaculdade(
  cursoId: string,
  faculdadeId: string
): Promise<{ valido: boolean; erro?: string }> {
  try {
    const { data: curso, error } = await supabase
      .from('cursos')
      .select('faculdade_id')
      .eq('id', cursoId)
      .single()

    if (error || !curso) {
      return { valido: false, erro: 'Curso não encontrado' }
    }

    if (curso.faculdade_id !== faculdadeId) {
      return { valido: false, erro: 'Curso não pertence à faculdade especificada' }
    }

    return { valido: true }
  } catch (error: any) {
    return { valido: false, erro: error.message || 'Erro ao validar curso' }
  }
}

/**
 * Valida se um agente IA pertence à faculdade especificada
 */
export async function validarAgenteIAFaculdade(
  agenteId: string,
  faculdadeId: string
): Promise<{ valido: boolean; erro?: string }> {
  try {
    const { data: agente, error } = await supabase
      .from('agentes_ia')
      .select('faculdade_id')
      .eq('id', agenteId)
      .single()

    if (error || !agente) {
      return { valido: false, erro: 'Agente IA não encontrado' }
    }

    if (agente.faculdade_id !== faculdadeId) {
      return { valido: false, erro: 'Agente IA não pertence à faculdade especificada' }
    }

    return { valido: true }
  } catch (error: any) {
    return { valido: false, erro: error.message || 'Erro ao validar agente IA' }
  }
}

/**
 * Valida se um item de base de conhecimento pertence à faculdade especificada
 */
export async function validarBaseConhecimentoFaculdade(
  itemId: string,
  faculdadeId: string
): Promise<{ valido: boolean; erro?: string }> {
  try {
    const { data: item, error } = await supabase
      .from('base_conhecimento')
      .select('faculdade_id')
      .eq('id', itemId)
      .single()

    if (error || !item) {
      return { valido: false, erro: 'Item de base de conhecimento não encontrado' }
    }

    if (item.faculdade_id !== faculdadeId) {
      return { valido: false, erro: 'Item de base de conhecimento não pertence à faculdade especificada' }
    }

    return { valido: true }
  } catch (error: any) {
    return { valido: false, erro: error.message || 'Erro ao validar item de base de conhecimento' }
  }
}

