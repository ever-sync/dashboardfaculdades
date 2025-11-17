import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Schema de validação para query params
const chartsQuerySchema = z.object({
  faculdade_id: z.string().uuid('ID de faculdade inválido').nullable().optional(),
  cliente_id: z.string().uuid('ID de cliente inválido').nullable().optional(),
}).refine((data) => data.faculdade_id || data.cliente_id, {
  message: 'faculdade_id ou cliente_id é obrigatório',
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validar query params (transformar null em undefined para Zod)
    const queryParams = {
      faculdade_id: searchParams.get('faculdade_id') || undefined,
      cliente_id: searchParams.get('cliente_id') || undefined,
    }
    
    const validation = chartsQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        { error: getUserFriendlyError(validation.error.errors[0].message) },
        { status: 400 }
      )
    }
    
    const faculdadeId = validation.data.faculdade_id || validation.data.cliente_id
    
    if (!faculdadeId) {
      return NextResponse.json(
        { error: 'faculdade_id ou cliente_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar métricas dos últimos 7 dias
    const seteDiasAtras = new Date()
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

    const { data: metricas } = await supabase
      .from('metricas_diarias')
      .select('*')
      .eq('faculdade_id', faculdadeId)
      .gte('data', seteDiasAtras.toISOString().split('T')[0])
      .order('data', { ascending: true })

    // Buscar conversas agrupadas por hora do dia (últimas 24h)
    const vinteQuatroHorasAtras = new Date()
    vinteQuatroHorasAtras.setHours(vinteQuatroHorasAtras.getHours() - 24)

    const { data: conversas } = await supabase
      .from('conversas_whatsapp')
      .select('data_ultima_mensagem, setor, departamento')
      .eq('faculdade_id', faculdadeId)
      .gte('data_ultima_mensagem', vinteQuatroHorasAtras.toISOString())

    // Buscar prospects convertidos do mês atual para cálculo de matrículas
    const primeiroDiaMes = new Date()
    primeiroDiaMes.setDate(1)
    primeiroDiaMes.setHours(0, 0, 0, 0)
    
    const { data: prospectsMatriculados } = await supabase
      .from('prospects_academicos')
      .select('data_matricula')
      .eq('faculdade_id', faculdadeId)
      .eq('status_academico', 'matriculado')

    // Criar mapa de matrículas por dia
    const matriculasPorDia = new Map<string, number>()
    prospectsMatriculados?.forEach(p => {
      if (p.data_matricula) {
        const dataMatricula = new Date(p.data_matricula).toISOString().split('T')[0]
        matriculasPorDia.set(dataMatricula, (matriculasPorDia.get(dataMatricula) || 0) + 1)
      }
    })

    // Processar dados para gráficos
    const evolucaoSemanal = (metricas || []).map(m => {
      const dataObj = new Date(m.data)
      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      const dataStr = m.data.split('T')[0]
      return {
        dia: diasSemana[dataObj.getDay()],
        conversas: m.total_conversas || 0,
        prospects: m.prospects_novos || m.novos_prospects || 0,
        matriculas: matriculasPorDia.get(dataStr) || 0,
      }
    })

    // Agrupar conversas por hora
    const conversasPorHora: Record<number, number> = {}
    conversas?.forEach(c => {
      if (c.data_ultima_mensagem) {
        const hora = new Date(c.data_ultima_mensagem).getHours()
        conversasPorHora[hora] = (conversasPorHora[hora] || 0) + 1
      }
    })

    const horas = Array.from({ length: 24 }, (_, i) => i)
    const conversasPorHoraData = horas.map(hora => ({
      hora: `${hora.toString().padStart(2, '0')}:00`,
      conversas: conversasPorHora[hora] || 0,
    }))

    // Agrupar por setor (usar setor ou departamento)
    const setoresMap = new Map<string, number>()
    conversas?.forEach(c => {
      const setorNome = c.setor || c.departamento || 'Não definido'
      if (setorNome) {
        const atual = setoresMap.get(setorNome) || 0
        setoresMap.set(setorNome, atual + 1)
      }
    })

    const cores = ['#6b7280', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    let corIndex = 0
    const setoresData = Array.from(setoresMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: cores[corIndex++ % cores.length],
    }))

    return NextResponse.json({
      evolucaoSemanal,
      conversasPorHora: conversasPorHoraData,
      setores: setoresData,
    })
  } catch (error) {
    // Log erro em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao buscar dados dos gráficos:', error)
    }
    
    return NextResponse.json(
      { error: getUserFriendlyError(error) },
      { status: 500 }
    )
  }
}

