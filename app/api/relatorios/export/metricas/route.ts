import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/middleware/withAuth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const GET = requireAuth(async (request: NextRequest, context) => {
    const { faculdadeId } = context

    try {
        const { searchParams } = new URL(request.url)
        const periodo = searchParams.get('periodo') || 'mes' // dia, semana, mes, trimestre, ano
        const dataInicio = searchParams.get('data_inicio')
        const dataFim = searchParams.get('data_fim')

        // Calculate date range based on period
        const agora = new Date()
        let inicio = new Date()

        if (dataInicio) {
            inicio = new Date(dataInicio)
        } else {
            switch (periodo) {
                case 'dia':
                    inicio.setDate(agora.getDate() - 1)
                    break
                case 'semana':
                    inicio.setDate(agora.getDate() - 7)
                    break
                case 'mes':
                    inicio.setMonth(agora.getMonth() - 1)
                    break
                case 'trimestre':
                    inicio.setMonth(agora.getMonth() - 3)
                    break
                case 'ano':
                    inicio.setFullYear(agora.getFullYear() - 1)
                    break
            }
        }

        const fim = dataFim ? new Date(dataFim) : agora

        // Fetch matriculas
        const { data: matriculas } = await supabase
            .from('prospects_academicos')
            .select('data_matricula, curso, valor_mensalidade')
            .eq('faculdade_id', faculdadeId)
            .eq('status_academico', 'matriculado')
            .not('data_matricula', 'is', null)
            .gte('data_matricula', inicio.toISOString())
            .lte('data_matricula', fim.toISOString())

        // Fetch prospects
        const { data: prospects } = await supabase
            .from('prospects_academicos')
            .select('created_at, status_academico')
            .eq('faculdade_id', faculdadeId)
            .gte('created_at', inicio.toISOString())
            .lte('created_at', fim.toISOString())

        // Group by period
        const metricas: Record<string, {
            matriculas: number
            prospects: number
            conversoes: number
            receita: number
        }> = {}

        // Helper to get period key
        const getPeriodoKey = (date: Date): string => {
            switch (periodo) {
                case 'dia':
                    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                case 'semana':
                    const weekStart = new Date(date)
                    weekStart.setDate(date.getDate() - date.getDay())
                    return `Semana ${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
                case 'mes':
                    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                case 'trimestre':
                    const quarter = Math.floor(date.getMonth() / 3) + 1
                    return `Q${quarter} ${date.getFullYear()}`
                case 'ano':
                    return date.getFullYear().toString()
                default:
                    return date.toLocaleDateString('pt-BR')
            }
        }

        // Process matriculas
        matriculas?.forEach(m => {
            if (m.data_matricula) {
                const data = new Date(m.data_matricula)
                const key = getPeriodoKey(data)
                if (!metricas[key]) {
                    metricas[key] = { matriculas: 0, prospects: 0, conversoes: 0, receita: 0 }
                }
                metricas[key].matriculas++
                metricas[key].conversoes++
                metricas[key].receita += Number(m.valor_mensalidade) || 0
            }
        })

        // Process prospects
        prospects?.forEach(p => {
            const data = new Date(p.created_at)
            const key = getPeriodoKey(data)
            if (!metricas[key]) {
                metricas[key] = { matriculas: 0, prospects: 0, conversoes: 0, receita: 0 }
            }
            metricas[key].prospects++
        })

        // Format for export
        const metricasFormatadas = Object.entries(metricas)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([periodo, dados]) => {
                const taxaConversao = dados.prospects > 0
                    ? ((dados.conversoes / dados.prospects) * 100).toFixed(1) + '%'
                    : '0%'

                const ticketMedio = dados.matriculas > 0
                    ? 'R$ ' + (dados.receita / dados.matriculas).toFixed(2)
                    : 'R$ 0,00'

                return {
                    periodo,
                    matriculas: dados.matriculas,
                    prospects: dados.prospects,
                    conversoes: dados.conversoes,
                    taxaConversao,
                    receita: 'R$ ' + dados.receita.toFixed(2),
                    ticketMedio
                }
            })

        return NextResponse.json({ data: metricasFormatadas })
    } catch (error) {
        console.error('Erro ao processar exportação de métricas:', error)
        return NextResponse.json(
            { error: 'Erro ao processar exportação' },
            { status: 500 }
        )
    }
}, 'relatorios.export')
