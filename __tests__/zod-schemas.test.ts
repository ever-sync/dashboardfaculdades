
import {
    createFaculdadeSchema,
    createConversaSchema,
    createMensagemSchema,
    createProspectSchema,
    validateData
} from '../src/lib/schemas'

describe('Zod Schemas', () => {
    describe('Faculdade Schema', () => {
        it('deve validar uma faculdade válida', () => {
            const faculdade = {
                nome: 'Faculdade Teste',
                sigla: 'FT',
                cnpj: '12345678000190',
                endereco: 'Rua Teste, 123',
                cidade: 'São Paulo',
                estado: 'SP',
                telefone: '(11) 99999-9999',
                email: 'contato@teste.com',
                site: 'https://teste.com',
                status: 'ativo',
                plano: 'basico',
                configuracoes: { tema: 'dark' }
            }

            const result = validateData(createFaculdadeSchema, faculdade)
            expect(result.success).toBe(true)
        })

        it('deve falhar se nome for curto demais', () => {
            const faculdade = {
                nome: 'A',
                sigla: 'FT',
                cnpj: '12345678000190',
                plano: 'basico',
                status: 'ativo'
            }

            const result = validateData(createFaculdadeSchema, faculdade)
            expect(result.success).toBe(false)
            if (!result.success) {
                // validateData retorna array de erros com { field, message }
                expect(result.error[0].field).toContain('nome')
            }
        })

        it('deve falhar se CNPJ for inválido', () => {
            const faculdade = {
                nome: 'Faculdade Teste',
                sigla: 'FT',
                cnpj: '123',
                plano: 'basico',
                status: 'ativo'
            }

            const result = validateData(createFaculdadeSchema, faculdade)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.some(i => i.field.includes('cnpj'))).toBe(true)
            }
        })
    })

    describe('Conversa Schema', () => {
        it('deve validar uma conversa válida', () => {
            const conversaSemStatus = {
                faculdade_id: '123e4567-e89b-12d3-a456-426614174000',
                prospect_id: '123e4567-e89b-12d3-a456-426614174001',
                telefone: '5511999999999',
                departamento: 'Comercial',
                nome: 'Conversa Teste'
            }

            const result = validateData(createConversaSchema, conversaSemStatus)
            expect(result.success).toBe(true)
        })

        it('deve falhar se telefone for inválido', () => {
            const conversa = {
                telefone: '123', // Inválido
                nome: 'Conversa Teste',
                departamento: 'Comercial'
            }

            const result = validateData(createConversaSchema, conversa)
            expect(result.success).toBe(false)
        })
    })

    describe('Mensagem Schema', () => {
        it('deve validar uma mensagem de texto válida', () => {
            const mensagem = {
                conversa_id: '123e4567-e89b-12d3-a456-426614174000',
                conteudo: 'Olá, tudo bem?',
                tipo_mensagem: 'texto',
                remetente: 'agente'
            }

            const result = validateData(createMensagemSchema, mensagem)
            expect(result.success).toBe(true)
        })

        it('deve falhar se conteúdo for vazio', () => {
            const mensagem = {
                conversa_id: '123e4567-e89b-12d3-a456-426614174000',
                conteudo: '',
                tipo_mensagem: 'texto'
            }

            const result = validateData(createMensagemSchema, mensagem)
            expect(result.success).toBe(false)
        })
    })

    describe('Prospect Schema', () => {
        it('deve validar um prospect válido', () => {
            const prospectCreate = {
                nome: 'João Silva',
                telefone: '5511999999999',
                email: 'joao@email.com',
                origem: 'whatsapp',
                curso: 'Direito'
            }

            const result = validateData(createProspectSchema, prospectCreate)
            expect(result.success).toBe(true)
        })

        it('deve validar email inválido', () => {
            const prospect = {
                nome: 'João Silva',
                telefone: '5511999999999',
                email: 'email-invalido',
                curso: 'Direito'
            }

            const result = validateData(createProspectSchema, prospect)
            expect(result.success).toBe(false)
        })
    })
})
