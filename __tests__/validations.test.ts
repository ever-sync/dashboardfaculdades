/**
 * Testes unitários para funções de validação
 * Execute com: npm test
 */

import {
  validateEmail,
  validatePassword,
  validateCNPJ,
  validatePhone,
  validateRequired,
  validateLength,
  validateEstado,
  validatePlano,
  validateStatus,
} from '../src/lib/validations'

describe('Validações', () => {
  describe('validateEmail', () => {
    it('deve validar email válido', () => {
      const result = validateEmail('teste@example.com')
      expect(result.isValid).toBe(true)
    })

    it('deve rejeitar email inválido', () => {
      const result = validateEmail('email-invalido')
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('deve rejeitar email vazio', () => {
      const result = validateEmail('')
      expect(result.isValid).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('deve validar senha com 6 ou mais caracteres', () => {
      const result = validatePassword('senha123')
      expect(result.isValid).toBe(true)
    })

    it('deve rejeitar senha muito curta', () => {
      const result = validatePassword('12345')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('mínimo 6')
    })

    it('deve rejeitar senha vazia', () => {
      const result = validatePassword('')
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateCNPJ', () => {
    it('deve validar CNPJ válido', () => {
      const result = validateCNPJ('12.345.678/0001-90')
      expect(result.isValid).toBe(true)
    })

    it('deve aceitar CNPJ vazio (opcional)', () => {
      const result = validateCNPJ('')
      expect(result.isValid).toBe(true)
    })

    it('deve rejeitar CNPJ com menos de 14 dígitos', () => {
      const result = validateCNPJ('123.456.789/0001')
      expect(result.isValid).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('deve validar telefone com 10 dígitos', () => {
      const result = validatePhone('(11) 1234-5678')
      expect(result.isValid).toBe(true)
    })

    it('deve validar telefone com 11 dígitos', () => {
      const result = validatePhone('(11) 91234-5678')
      expect(result.isValid).toBe(true)
    })

    it('deve aceitar telefone vazio (opcional)', () => {
      const result = validatePhone('')
      expect(result.isValid).toBe(true)
    })

    it('deve rejeitar telefone inválido', () => {
      const result = validatePhone('123')
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateRequired', () => {
    it('deve validar valor preenchido', () => {
      const result = validateRequired('teste', 'Campo')
      expect(result.isValid).toBe(true)
    })

    it('deve rejeitar valor vazio', () => {
      const result = validateRequired('', 'Campo')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('obrigatório')
    })
  })

  describe('validateLength', () => {
    it('deve validar comprimento dentro do range', () => {
      const result = validateLength('teste', 3, 10, 'Campo')
      expect(result.isValid).toBe(true)
    })

    it('deve rejeitar valor muito curto', () => {
      const result = validateLength('te', 3, 10, 'Campo')
      expect(result.isValid).toBe(false)
    })

    it('deve rejeitar valor muito longo', () => {
      const result = validateLength('texto muito longo', 3, 10, 'Campo')
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateEstado', () => {
    it('deve validar estado válido', () => {
      const result = validateEstado('SP')
      expect(result.isValid).toBe(true)
    })

    it('deve aceitar estado vazio (opcional)', () => {
      const result = validateEstado('')
      expect(result.isValid).toBe(true)
    })

    it('deve rejeitar estado inválido', () => {
      const result = validateEstado('XX')
      expect(result.isValid).toBe(false)
    })
  })

  describe('validatePlano', () => {
    it('deve validar plano válido', () => {
      expect(validatePlano('basico').isValid).toBe(true)
      expect(validatePlano('pro').isValid).toBe(true)
      expect(validatePlano('enterprise').isValid).toBe(true)
    })

    it('deve rejeitar plano inválido', () => {
      const result = validatePlano('invalid')
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateStatus', () => {
    it('deve validar status válido', () => {
      expect(validateStatus('ativo').isValid).toBe(true)
      expect(validateStatus('inativo').isValid).toBe(true)
      expect(validateStatus('suspenso').isValid).toBe(true)
    })

    it('deve rejeitar status inválido', () => {
      const result = validateStatus('invalid')
      expect(result.isValid).toBe(false)
    })
  })
})

