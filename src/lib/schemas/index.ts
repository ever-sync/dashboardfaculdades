import { z } from 'zod'

// Schema de Faculdade
export const faculdadeSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(255),
    cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos').optional().or(z.literal('')),
    telefone: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    endereco: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().length(2, 'Estado deve ter 2 caracteres').optional().or(z.literal('')),
    plano: z.enum(['basico', 'pro', 'enterprise']),
    status: z.enum(['ativo', 'inativo', 'suspenso']),
    evolution_instance: z.string().optional(),
})

export const createFaculdadeSchema = faculdadeSchema
export const updateFaculdadeSchema = faculdadeSchema.partial()

// Schema de Conversa
export const conversaSchema = z.object({
    telefone: z.string().min(10, 'Telefone inválido'),
    nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    status: z.enum(['ativo', 'pendente', 'encerrado']),
    departamento: z.string(),
    setor: z.string().optional(),
    atendente_id: z.string().uuid().optional(),
    prospect_id: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
    bloqueado: z.boolean().optional(),
    motivo_bloqueio: z.string().optional(),
})

export const createConversaSchema = conversaSchema.omit({ status: true })
export const updateConversaSchema = conversaSchema.partial()

// Schema de Mensagem
export const mensagemSchema = z.object({
    conversa_id: z.string().uuid('ID de conversa inválido'),
    conteudo: z.string().min(1, 'Mensagem não pode estar vazia'),
    remetente: z.enum(['usuario', 'agente', 'bot']),
    tipo_mensagem: z.enum(['texto', 'imagem', 'documento', 'audio', 'video']),
    midia_url: z.string().url().optional().or(z.literal('')),
})

export const createMensagemSchema = mensagemSchema

// Schema de Prospect
export const prospectSchema = z.object({
    nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    nome_completo: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    telefone: z.string().min(10, 'Telefone inválido'),
    cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').optional().or(z.literal('')),
    data_nascimento: z.string().optional(),
    tipo_prospect: z.enum(['aluno', 'nao_aluno', 'ex_aluno']).optional(),
    curso: z.string(),
    curso_pretendido: z.string().optional(),
    turno: z.enum(['manha', 'tarde', 'noite', 'ead']).optional(),
    status_academico: z.enum(['novo', 'contatado', 'qualificado', 'matriculado', 'perdido']),
    origem: z.string().optional(),
    cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos').optional().or(z.literal('')),
    endereco: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    municipio: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().length(2, 'Estado deve ter 2 caracteres').optional().or(z.literal('')),
    data_pagamento: z.number().int().min(1).max(31).optional(),
    valor_mensalidade: z.number().positive('Valor deve ser positivo').optional(),
    observacoes: z.string().optional(),
    nota_qualificacao: z.number().int().min(0).max(100),
})

export const createProspectSchema = prospectSchema.omit({ status_academico: true, nota_qualificacao: true })
export const updateProspectSchema = prospectSchema.partial()

// Schema de Agente IA
export const agenteIASchema = z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    script_atendimento: z.string().min(10, 'Script deve ter no mínimo 10 caracteres'),
    setor: z.enum(['Suporte', 'Vendas', 'Atendimento']).optional(),
    descricao: z.string().optional(),
    ativo: z.boolean(),
    configuracao: z.record(z.string(), z.any()).optional(),
})

export const createAgenteIASchema = agenteIASchema
export const updateAgenteIASchema = agenteIASchema.partial()

// Schema de Curso
export const cursoSchema = z.object({
    curso: z.string().min(3, 'Nome do curso deve ter no mínimo 3 caracteres'),
    quantidade_de_parcelas: z.number().int().positive('Quantidade de parcelas deve ser positiva'),
    modalidade: z.enum(['Presencial', 'EAD', 'Híbrido']),
    duracao: z.string(),
    valor_com_desconto_pontualidade: z.number().positive('Valor deve ser positivo'),
    desconto_percentual: z.number().min(0).max(100, 'Desconto deve estar entre 0 e 100'),
    pratica: z.boolean(),
    laboratorio: z.boolean(),
    estagio: z.boolean(),
    tcc: z.boolean(),
    link: z.string().url().optional().or(z.literal('')),
    descricao: z.string().optional(),
    categoria: z.string().optional(),
    ativo: z.boolean(),
})

export const createCursoSchema = cursoSchema
export const updateCursoSchema = cursoSchema.partial()

// Schema de Usuário/Atendente
export const usuarioSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('Email inválido'),
    senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').optional(),
    setor: z.enum(['Suporte', 'Vendas', 'Atendimento']).optional(),
    status: z.enum(['online', 'offline', 'ausente', 'ocupado']).optional(),
    carga_trabalho_maxima: z.number().int().positive().optional(),
    horario_trabalho_inicio: z.string().optional(),
    horario_trabalho_fim: z.string().optional(),
    dias_trabalho: z.array(z.number().int().min(0).max(6)).optional(),
    ativo: z.boolean().optional(),
})

export const createUsuarioSchema = usuarioSchema
export const updateUsuarioSchema = usuarioSchema.omit({ senha: true }).partial()
export const updateSenhaSchema = z.object({
    senha_atual: z.string().min(8),
    senha_nova: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    confirmar_senha: z.string(),
}).refine((data) => data.senha_nova === data.confirmar_senha, {
    message: 'Senhas não coincidem',
    path: ['confirmar_senha'],
})

// Schema de Mensagem Agendada
export const mensagemAgendadaSchema = z.object({
    conversa_id: z.string().uuid().optional(),
    telefone: z.string().min(10, 'Telefone inválido'),
    conteudo: z.string().min(1, 'Mensagem não pode estar vazia'),
    tipo_mensagem: z.enum(['texto', 'imagem', 'documento', 'audio', 'video']),
    midia_url: z.string().url().optional().or(z.literal('')),
    data_agendamento: z.string().datetime('Data de agendamento inválida'),
    remetente: z.enum(['usuario', 'agente', 'bot', 'robo', 'humano', 'cliente']).optional(),
})

export const createMensagemAgendadaSchema = mensagemAgendadaSchema

// Helper para validar dados
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown) {
    try {
        const validated = schema.parse(data)
        return { success: true as const, data: validated }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false as const,
                error: error.issues.map((e: z.ZodIssue) => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            }
        }
        return {
            success: false as const,
            error: [{ field: 'unknown', message: 'Erro de validação desconhecido' }],
        }
    }
}
