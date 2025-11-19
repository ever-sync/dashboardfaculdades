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
      .select('data_matricula, curso, valor_mensalidade, status_academico')
      .eq('faculdade_id', faculdadeId)
      .eq('status_academico', 'matriculado')
      .not('data_matricula', 'is', null)
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
        matriculasPorMes[chave].receita += Number((m as any).valor_mensalidade) || 0
      }
    })

    prospects?.forEach((p: any) => {
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
    prospects?.forEach((p: any) => {
      const curso = p.curso || 'Não informado'
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
    prospects?.forEach((p: any) => {
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
    const totalReceita = matriculas?.reduce((sum, m: any) => sum + (Number(m.valor_mensalidade) || 0), 0) || 0
    const taxaConversao = totalProspects > 0 ? (totalMatriculas / totalProspects) * 100 : 0

    // Desempenho da equipe
    // Buscar atendentes/usuários
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('faculdade_id', faculdadeId)

    const desempenhoEquipe = []

    if (usuarios && usuarios.length > 0) {
      for (const usuario of usuarios) {
        // Contar conversas atribuídas ao atendente
        const { count: atendimentos } = await supabase
          .from('conversas_whatsapp')
          .select('*', { count: 'exact', head: true })
          .eq('faculdade_id', faculdadeId)
          .eq('atendente_id', usuario.id)
          .gte('created_at', dataInicio.toISOString())

        // Buscar prospects atendidos por este usuário (via conversas)
        const { data: conversasAtendente } = await supabase
          .from('conversas_whatsapp')
          .select('telefone')
          .eq('faculdade_id', faculdadeId)
          .eq('atendente_id', usuario.id)
          .gte('created_at', dataInicio.toISOString())

        const telefonesAtendidos = conversasAtendente?.map(c => c.telefone) || []
        
        // Buscar prospects relacionados a essas conversas
        let prospectsAtendidos = 0
        let prospectsConvertidos = 0
        let notaMedia = 0

        if (telefonesAtendidos.length > 0) {
          const { data: prospectsRelacionados } = await supabase
            .from('prospects_academicos')
            .select('status_academico, nota_qualificacao')
            .eq('faculdade_id', faculdadeId)
            .in('telefone', telefonesAtendidos)
            .gte('created_at', dataInicio.toISOString())

          prospectsAtendidos = prospectsRelacionados?.length || 0
          prospectsConvertidos = prospectsRelacionados?.filter(p => p.status_academico === 'matriculado').length || 0
          
          // Buscar avaliações das conversas para calcular nota média
          const { data: conversasComAvaliacao } = await supabase
            .from('conversas_whatsapp')
            .select('avaliacao_nota')
            .eq('faculdade_id', faculdadeId)
            .eq('atendente_id', usuario.id)
            .in('telefone', telefonesAtendidos)
            .not('avaliacao_nota', 'is', null)
            .gte('created_at', dataInicio.toISOString())

          // Calcular nota média das avaliações das conversas
          const notas = conversasComAvaliacao?.map(c => c.avaliacao_nota).filter(n => n != null) || []
          if (notas.length > 0) {
            notaMedia = notas.reduce((sum, n) => sum + (Number(n) || 0), 0) / notas.length
          } else if (prospectsRelacionados && prospectsRelacionados.length > 0) {
            // Fallback: usar nota_qualificacao dos prospects (normalizada para 0-5)
            const notasQualificacao = prospectsRelacionados
              .map(p => p.nota_qualificacao)
              .filter(n => n != null && n > 0) || []
            if (notasQualificacao.length > 0) {
              // Normalizar de 0-100 para 0-5
              notaMedia = (notasQualificacao.reduce((sum, n) => sum + (Number(n) || 0), 0) / notasQualificacao.length) / 20
            }
          }
        }

        // Calcular taxa de conversão
        const taxaConversaoAtendente = prospectsAtendidos > 0 
          ? (prospectsConvertidos / prospectsAtendidos) * 100 
          : 0

        desempenhoEquipe.push({
          nome: usuario.nome || 'Sem nome',
          atendimentos: atendimentos || 0,
          conversao: Math.round(taxaConversaoAtendente * 10) / 10,
          nota: Math.round(notaMedia * 10) / 10,
        })
      }
    }

    // Ordenar por desempenho (atendimentos + conversão)
    desempenhoEquipe.sort((a, b) => {
      const scoreA = a.atendimentos + (a.conversao * 10)
      const scoreB = b.atendimentos + (b.conversao * 10)
      return scoreB - scoreA
    })

    return NextResponse.json({
      relatorioMensal,
      cursosMaisProcurados,
      fontesLead,
      desempenhoEquipe,
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

