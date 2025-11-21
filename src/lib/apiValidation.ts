/**
 * Schemas de validação Zod para APIs
 */
import { z } from 'zod'

// Schema para login
export const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória').min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

// Schema para faculdade
export const faculdadeSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(255, 'Nome muito longo'),
  cnpj: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres').optional().nullable().or(z.literal('')),
  plano: z.enum(['basico', 'pro', 'enterprise']),
  status: z.enum(['ativo', 'inativo', 'suspenso']),
})

// Schema para agente IA
export const agenteIASchema = z.object({
  faculdade_id: z.string().uuid('ID de faculdade inválido'),
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  script_atendimento: z.string().min(1, 'Script de atendimento é obrigatório'),
  ativo: z.boolean().optional().default(true),
  setor: z.enum(['Suporte', 'Vendas', 'Atendimento']).optional().nullable(),
  descricao: z.string().optional().nullable(),
})

// Schema para curso
export const cursoSchema = z.object({
  faculdade_id: z.string().uuid('ID de faculdade inválido'),
  curso: z.string().min(1, 'Nome do curso é obrigatório').max(255, 'Nome muito longo'),
  quantidade_de_parcelas: z.number().int().min(1, 'Quantidade de parcelas deve ser pelo menos 1').max(120),
  modalidade: z.enum(['Presencial', 'EAD', 'Híbrido']),
  duracao: z.string().min(1, 'Duração é obrigatória'),
  valor_com_desconto_pontualidade: z.number().min(0, 'Valor não pode ser negativo'),
  desconto_percentual: z.number().min(0).max(100, 'Desconto não pode ser maior que 100%'),
  pratica: z.boolean().optional().default(false),
  laboratorio: z.boolean().optional().default(false),
  estagio: z.boolean().optional().default(false),
  tcc: z.boolean().optional().default(false),
  link: z.string().url('URL inválida').optional().nullable().or(z.literal('')),
  descricao: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  ativo: z.boolean().optional().default(true),
})

// Schema para base de conhecimento
export const baseConhecimentoSchema = z.object({
  faculdade_id: z.string().uuid('ID de faculdade inválido'),
  pergunta: z.string().min(1, 'Pergunta é obrigatória'),
  resposta: z.string().min(1, 'Resposta é obrigatória'),
  categoria: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  ativo: z.boolean().optional().default(true),
})

// Schema para query params
export const faculdadeIdSchema = z.object({
  faculdade_id: z.string().uuid('ID de faculdade inválido'),
})

export const clienteIdSchema = z.object({
  cliente_id: z.string().uuid('ID de cliente inválido'),
})

// Schema para paginação
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
})

// Schema para período
export const periodoSchema = z.object({
  periodo: z.enum(['dia', 'semana', 'mes', 'trimestre', 'ano']).optional().default('mes'),
})

/**
 * Valida dados usando um schema Zod
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Dados inválidos',
      }
    }
    return { success: false, error: 'Erro de validação desconhecido' }
  }
}
