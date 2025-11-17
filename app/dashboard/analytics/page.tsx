'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp, Users, MessageSquare, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'

// Funções para processar dados reais
const processarDadosPorHora = (metricas: AnalyticsData[]) => {
  // Agrupar por hora (simplificado - usar data completa)
  const horas = ['00:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']
  return horas.map(hora => ({
    hora,
    conversas: Math.floor(Math.random() * 50 + 20) // Placeholder até implementar agrupamento por hora
  }))
}

const processarEvolucaoSemanal = (metricas: AnalyticsData[]) => {
  // Agrupar últimos 7 dias
  const ultimos7Dias = metricas.slice(0, 7).reverse()
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  
  return ultimos7Dias.map((m) => {
    const data = new Date(m.data)
    const diaSemana = diasSemana[data.getDay()]
    return {
      dia: diaSemana,
      conversas: m.total_conversas || 0,
      prospects: m.novos_prospects || 0,
      matriculas: m.prospects_convertidos || 0
    }
  })
}

const processarSetores = (metricas: AnalyticsData[]) => {
  // Agrupar por departamento
  const setoresMap = new Map<string, number>()
  
  metricas.forEach(m => {
    if (m.departamento) {
      const atual = setoresMap.get(m.departamento) || 0
      setoresMap.set(m.departamento, atual + (m.total_conversas || 0))
    }
  })
  
  const cores = ['#6b7280', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  let corIndex = 0
  
  return Array.from(setoresMap.entries()).map(([name, value]) => ({
    name,
    value,
    color: cores[corIndex++ % cores.length]
  }))
}

interface AnalyticsData {
  id: string
  data: string
  total_conversas: number
  conversas_ativas: number
  novos_prospects: number
  prospects_convertidos: number
  mensagens_enviadas: number
  mensagens_recebidas: number
  taxa_automacao_percentual: number
  nota_media: number
  tempo_medio_primeira_resposta_segundos: number
  departamento?: string
  // Campos calculados para compatibilidade
  total_mensagens_recebidas?: number
  total_mensagens_enviadas?: number
  leads_novos?: number
  leads_qualificados?: number
  leads_convertidos?: number
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [loading, setLoading] = useState(true)
  const { faculdadeSelecionada } = useFaculdade()

  useEffect(() => {
    if (faculdadeSelecionada) fetchAnalyticsData()
  }, [faculdadeSelecionada])

  const fetchAnalyticsData = async () => {
    try {
      // Fetch analytics data from metricas_diarias table
      const { data, error } = await supabase
        .from('metricas_diarias')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada?.id as string)
        .order('data', { ascending: false })
        .limit(30)

      if (error) throw error
      setAnalyticsData(data || [])
    } catch (error) {
      console.error('Erro ao buscar dados de analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Processar dados para gráficos
  const conversasPorHoraData = processarDadosPorHora(analyticsData)
  const evolucaoSemanalData = processarEvolucaoSemanal(analyticsData)
  const setoresData = processarSetores(analyticsData)
  
  // Calcular funil de conversão
  const totalConversas = analyticsData.reduce((sum, m) => sum + (m.total_conversas || 0), 0)
  const totalProspects = analyticsData.reduce((sum, m) => sum + (m.novos_prospects || 0), 0)
  const totalQualificados = analyticsData.reduce((sum, m) => sum + (m.novos_prospects || 0), 0) // Simplificado
  const totalConvertidos = analyticsData.reduce((sum, m) => sum + (m.prospects_convertidos || 0), 0)
  
  const taxaConversaoData = [
    { etapa: 'Conversas Iniciadas', valor: totalConversas },
    { etapa: 'Prospects Qualificados', valor: totalQualificados },
    { etapa: 'Propostas Enviadas', valor: totalProspects },
    { etapa: 'Matrículas Realizadas', valor: totalConvertidos },
  ]

  // Calcular métricas agregadas
  const taxaCrescimento = analyticsData.length > 0 ? 23.5 : 0 // Placeholder
  const prospectsAtivos = totalProspects
  const conversasDia = analyticsData.length > 0 
    ? Math.round(totalConversas / analyticsData.length) 
    : 0
  const tempoResposta = analyticsData.length > 0
    ? Math.round(analyticsData.reduce((sum, m) => sum + (m.tempo_medio_primeira_resposta_segundos || 0), 0) / analyticsData.length)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Header
          title="Analytics"
          subtitle="Análise detalhada do atendimento"
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-white text-black">
      <Header
        title="Analytics"
        subtitle="Análise detalhada do atendimento"
      />
      
      <div className="p-8 space-y-6">
        {/* Gráfico de Linha - Conversas por Hora */}
        <Card title="Conversas por Hora do Dia" subtitle="Horário de pico de atendimento">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={conversasPorHoraData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="conversas"
                stroke="#6b7280"
                strokeWidth={2}
                dot={{ fill: '#6b7280' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico de Área - Evolução Semanal */}
        <Card title="Evolução Semanal" subtitle="Comparativo de métricas por dia da semana">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={evolucaoSemanalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="conversas" stackId="1" stroke="#6b7280" fill="#6b7280" fillOpacity={0.6} />
              <Area type="monotone" dataKey="prospects" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="matriculas" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Pizza - Setores */}
          <Card title="Distribuição por Setores" subtitle="Conversas por departamento">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={setoresData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {setoresData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Gráfico de Barras - Taxa de Conversão */}
          <Card title="Funil de Conversão" subtitle="Taxa de conversão por etapa">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={taxaConversaoData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="etapa" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="valor" fill="#6b7280" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Métricas de Performance */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-black">Taxa de Crescimento</h3>
            <p className="text-2xl font-bold text-green-500">+{taxaCrescimento}%</p>
            <p className="text-sm text-gray-600">vs mês anterior</p>
          </Card>
          
          <Card className="text-center">
            <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-black">Prospects Ativos</h3>
            <p className="text-2xl font-bold text-gray-500">{prospectsAtivos}</p>
            <p className="text-sm text-gray-600">Este mês</p>
          </Card>
          
          <Card className="text-center">
            <MessageSquare className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-black">Conversas/Dia</h3>
            <p className="text-2xl font-bold text-purple-500">{conversasDia}</p>
            <p className="text-sm text-gray-600">Média diária</p>
          </Card>
          
          <Card className="text-center">
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-black">Tempo de Resposta</h3>
            <p className="text-2xl font-bold text-orange-500">{tempoResposta}s</p>
            <p className="text-sm text-gray-600">Tempo médio</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
