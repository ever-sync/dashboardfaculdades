// Utilitários de validação

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: 'Email é obrigatório' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Email inválido' }
  }

  return { isValid: true }
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Senha é obrigatória' }
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Senha deve ter no mínimo 6 caracteres' }
  }

  return { isValid: true }
}

export function validateCNPJ(cnpj: string): ValidationResult {
  if (!cnpj) {
    return { isValid: true } // CNPJ é opcional
  }

  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '')

  if (cleanCNPJ.length !== 14) {
    return { isValid: false, error: 'CNPJ deve ter 14 dígitos' }
  }

  // Validação básica de CNPJ (verificar se não é sequência)
  if (/^(\d)\1+$/.test(cleanCNPJ)) {
    return { isValid: false, error: 'CNPJ inválido' }
  }

  return { isValid: true }
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: true } // Telefone é opcional
  }

  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/[^\d]/g, '')

  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { isValid: false, error: 'Telefone deve ter 10 ou 11 dígitos' }
  }

  return { isValid: true }
}

export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} é obrigatório` }
  }

  return { isValid: true }
}

export function validateLength(value: string, min: number, max: number, fieldName: string): ValidationResult {
  if (value.length < min) {
    return { isValid: false, error: `${fieldName} deve ter no mínimo ${min} caracteres` }
  }

  if (value.length > max) {
    return { isValid: false, error: `${fieldName} deve ter no máximo ${max} caracteres` }
  }

  return { isValid: true }
}

export function validateEstado(estado: string): ValidationResult {
  if (!estado) {
    return { isValid: true } // Estado é opcional
  }

  const estadosValidos = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  if (!estadosValidos.includes(estado.toUpperCase())) {
    return { isValid: false, error: 'Estado inválido' }
  }

  return { isValid: true }
}

export function validatePlano(plano: string): ValidationResult {
  const planosValidos = ['basico', 'pro', 'enterprise']
  
  if (!planosValidos.includes(plano)) {
    return { isValid: false, error: 'Plano inválido' }
  }

  return { isValid: true }
}

export function validateStatus(status: string): ValidationResult {
  const statusValidos = ['ativo', 'inativo', 'suspenso']
  
  if (!statusValidos.includes(status)) {
    return { isValid: false, error: 'Status inválido' }
  }

  return { isValid: true }
}

