import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/middleware/withAuth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const GET = requireAuth(async (request: NextRequest, context) => {
    const { faculdadeId } = context

    try {
        const { searchParams } = new URL(request.url)
        const dataInicio = searchParams.get('data_inicio')
        const dataFim = searchParams.get('data_fim')
        const statusAcademico = searchParams.get('status')
        const curso = searchParams.get('curso')
        const origem = searchParams.get('origem')

        // Build query
        let query = supabase
            .from('prospects_academicos')
            .select('*')
            .eq('faculdade_id', faculdadeId)
            .order('created_at', { ascending: false })

        // Apply filters
        if (dataInicio) {
            query = query.gte('created_at', dataInicio)
        }
        if (dataFim) {
            query = query.lte('created_at', dataFim)
        }
        if (statusAcademico) {
            query = query.eq('status_academico', statusAcademico)
        }
        if (curso) {
            query = query.eq('curso', curso)
        }
        if (origem) {
            query = query.eq('origem', origem)
        }

        const { data: prospects, error } = await query

        if (error) {
            console.error('Erro ao buscar prospects:', error)
            return NextResponse.json({ error: 'Erro ao buscar prospects' }, { status: 500 })
        }

        // Format data for export
        const prospectsFormatados = (prospects || []).map(prospect => ({
            data: new Date(prospect.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            nome: prospect.nome || 'Sem nome',
            telefone: prospect.telefone || '',
            email: prospect.email || '',
            curso: prospect.curso || 'Não informado',
            origem: prospect.origem || 'Não informado',
            status: prospect.status_academico || 'lead',
            nota: prospect.nota_qualificacao || 0
        }))

        return NextResponse.json({ data: prospectsFormatados })
    } catch (error) {
        console.error('Erro ao processar exportação de prospects:', error)
        return NextResponse.json(
            { error: 'Erro ao processar exportação' },
            { status: 500 }
        )
    }
}, 'relatorios.export')
