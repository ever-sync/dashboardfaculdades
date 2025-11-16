import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const faculdadeId = searchParams.get('faculdade_id') || searchParams.get('cliente_id')
    const periodo = searchParams.get('periodo') || 'mes' // dia, semana, mes, trimestre, ano

    if (!faculdadeId) {
      return NextResponse.json({ error: 'faculdade_id é obrigatório' }, { status: 400 })
    }

    // Calcular datas baseado no período
    const agora = new Date()
    const dataInicio = new Date()
    
    switch (periodo) {
      case 'dia':
        dataInicio.setDate(agora.getDate() - 1)
        break
      case 'semana':
        dataInicio.setDate(agora.getDate() - 7)
        break
      case 'mes':
        dataInicio.setMonth(agora.getMonth() - 1)
        break
      case 'trimestre':
        dataInicio.setMonth(agora.getMonth() - 3)
        break
      case 'ano':
        dataInicio.setFullYear(agora.getFullYear() - 1)
        break
    }

    // Buscar matrículas do período
    const { data: matriculas } = await supabase
      .from('prospects_academicos')
      .select('data_matricula, curso, valor_mensalidade')
      .eq('faculdade_id', faculdadeId)
      .eq('status_academico', 'matriculado')
      .gte('data_matricula', dataInicio.toISOString())

    // Buscar prospects do período
    const { data: prospects } = await supabase
      .from('prospects_academicos')
      .select('curso, status_academico, origem, created_at')
      .eq('faculdade_id', faculdadeId)
      .gte('created_at', dataInicio.toISOString())

    // Agrupar por mês
    const matriculasPorMes: Record<string, { matriculas: number; receita: number; prospects: number }> = {}
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

    matriculas?.forEach(m => {
      if (m.data_matricula) {
        const data = new Date(m.data_matricula)
        const chave = `${data.getFullYear()}-${data.getMonth()}`
        if (!matriculasPorMes[chave]) {
          matriculasPorMes[chave] = { matriculas: 0, receita: 0, prospects: 0 }
        }
        matriculasPorMes[chave].matriculas++
        matriculasPorMes[chave].receita += Number(m.valor_mensalidade) || 0
      }
    })

    prospects?.forEach(p => {
      const data = new Date(p.created_at)
      const chave = `${data.getFullYear()}-${data.getMonth()}`
      if (!matriculasPorMes[chave]) {
        matriculasPorMes[chave] = { matriculas: 0, receita: 0, prospects: 0 }
      }
      matriculasPorMes[chave].prospects++
    })

    const relatorioMensal = Object.entries(matriculasPorMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Últimos 6 meses
      .map(([chave, dados]) => {
        const [ano, mes] = chave.split('-')
        return {
          mes: meses[parseInt(mes)],
          matriculas: dados.matriculas,
          prospects: dados.prospects,
          receita: dados.receita,
        }
      })

    // Cursos mais procurados
    const cursosMap = new Map<string, { procuras: number; matriculas: number }>()
    prospects?.forEach(p => {
      const curso = (p as any).curso || 'Não informado'
      const atual = cursosMap.get(curso) || { procuras: 0, matriculas: 0 }
      atual.procuras++
      if (p.status_academico === 'matriculado') {
        atual.matriculas++
      }
      cursosMap.set(curso, atual)
    })

    const cursosMaisProcurados = Array.from(cursosMap.entries())
      .map(([curso, dados]) => ({
        curso,
        procuras: dados.procuras,
        matriculas: dados.matriculas,
      }))
      .sort((a, b) => b.procuras - a.procuras)
      .slice(0, 6)

    // Fontes de leads
    const fontesMap = new Map<string, { leads: number; matriculados: number }>()
    prospects?.forEach(p => {
      const origem = p.origem || 'Não informado'
      const atual = fontesMap.get(origem) || { leads: 0, matriculados: 0 }
      atual.leads++
      if (p.status_academico === 'matriculado') {
        atual.matriculados++
      }
      fontesMap.set(origem, atual)
    })

    const fontesLead = Array.from(fontesMap.entries())
      .map(([fonte, dados]) => ({
        fonte,
        leads: dados.leads,
        conversao: dados.leads > 0 ? (dados.matriculados / dados.leads) * 100 : 0,
      }))
      .sort((a, b) => b.leads - a.leads)

    // Calcular totais
    const totalMatriculas = matriculas?.length || 0
    const totalProspects = prospects?.length || 0
    const totalReceita = matriculas?.reduce((sum, m) => sum + (Number(m.valor_mensalidade) || 0), 0) || 0
    const taxaConversao = totalProspects > 0 ? (totalMatriculas / totalProspects) * 100 : 0

    return NextResponse.json({
      relatorioMensal,
      cursosMaisProcurados,
      fontesLead,
      totais: {
        matriculas: totalMatriculas,
        prospects: totalProspects,
        receita: totalReceita,
        taxaConversao: Math.round(taxaConversao * 10) / 10,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar dados do relatório:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do relatório' },
      { status: 500 }
    )
  }
}

