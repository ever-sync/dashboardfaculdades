/**
 * Mapeamento de códigos de erro para mensagens amigáveis ao usuário
 */

export interface ErrorMapping {
  [key: string]: string
}

// Erros do Supabase
export const supabaseErrorMessages: ErrorMapping = {
  'PGRST116': 'Nenhum registro encontrado',
  '23505': 'Este registro já existe',
  '23503': 'Erro de referência: registro relacionado não encontrado',
  '23502': 'Campo obrigatório não preenchido',
  '23514': 'Valor inválido: não atende aos requisitos',
  '42P01': 'Tabela não encontrada',
  '42501': 'Sem permissão para esta operação',
  'new row violates row-level security policy': 'Sem permissão para criar este registro',
  'Policy violation': 'Operação não permitida pelas políticas de segurança',
}

// Erros de validação
export const validationErrorMessages: ErrorMapping = {
  'required': 'Este campo é obrigatório',
  'email': 'Email inválido',
  'min': 'Valor muito pequeno',
  'max': 'Valor muito grande',
  'invalid': 'Valor inválido',
}

// Erros de autenticação
export const authErrorMessages: ErrorMapping = {
  'Invalid login credentials': 'Email ou senha incorretos',
  'Email not confirmed': 'Por favor, confirme seu email antes de fazer login',
  'User not found': 'Usuário não encontrado',
  'Invalid token': 'Sessão expirada. Por favor, faça login novamente',
  'Token expired': 'Sessão expirada. Por favor, faça login novamente',
}

// Erros de rede
export const networkErrorMessages: ErrorMapping = {
  'Failed to fetch': 'Erro de conexão. Verifique sua internet',
  'NetworkError': 'Erro de conexão. Tente novamente',
  'timeout': 'Tempo de espera esgotado. Tente novamente',
}

/**
 * Obtém mensagem amigável para um erro
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'Ocorreu um erro desconhecido'

  // Se for string, verificar nos mapeamentos
  if (typeof error === 'string') {
    // Verificar em todos os mapeamentos
    const allMappings = {
      ...supabaseErrorMessages,
      ...validationErrorMessages,
      ...authErrorMessages,
      ...networkErrorMessages,
    }

    // Buscar mensagem exata ou parcial
    for (const [key, message] of Object.entries(allMappings)) {
      if (error.toLowerCase().includes(key.toLowerCase())) {
        return message
      }
    }

    return error
  }

  // Se for objeto Error
  if (error instanceof Error) {
    const message = error.message

    // Verificar códigos de erro específicos
    if ((error as any).code) {
      const code = String((error as any).code)
      if (supabaseErrorMessages[code]) {
        return supabaseErrorMessages[code]
      }
    }

    // Verificar mensagens conhecidas
    const allMappings = {
      ...supabaseErrorMessages,
      ...validationErrorMessages,
      ...authErrorMessages,
      ...networkErrorMessages,
    }

    for (const [key, friendlyMessage] of Object.entries(allMappings)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return friendlyMessage
      }
    }

    // Se não encontrou, retornar mensagem original
    return message
  }

  // Se for objeto com propriedades
  if (typeof error === 'object') {
    const errorObj = error as any

    // Verificar código de erro
    if (errorObj.code) {
      if (supabaseErrorMessages[errorObj.code]) {
        return supabaseErrorMessages[errorObj.code]
      }
    }

    // Verificar mensagem
    if (errorObj.message) {
      return getErrorMessage(errorObj.message)
    }

    // Verificar hint (Supabase)
    if (errorObj.hint) {
      return errorObj.hint
    }
  }

  return 'Ocorreu um erro desconhecido'
}

/**
 * Obtém mensagem de erro amigável para exibição ao usuário
 */
export function getUserFriendlyError(error: unknown): string {
  try {
    return getErrorMessage(error)
  } catch {
    return 'Ocorreu um erro inesperado. Por favor, tente novamente.'
  }
}
