'use client'

import { Header } from '@/components/dashboard/Header'
import { StatsCard } from '@/components/ui/StatsCard'
import { DashboardStats } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import {
  Users,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Bot,
  Clock,
  Star,
  GraduationCap
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'

export default function DashboardPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (faculdadeSelecionada) fetchStats()
  }, [faculdadeSelecionada])
  
  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/dashboard/stats?cliente_id=${faculdadeSelecionada?.id}`)
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (!stats) {
    return (
      <div className="min-h-screen bg-white text-black p-8">
        <Header
          title="Dashboard"
          subtitle="Visão geral do atendimento WhatsApp"
        />
        <p className="mt-8 text-center text-red-500">
          Erro ao carregar dados do dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Header
        title="Dashboard"
        subtitle="Visão geral do atendimento WhatsApp"
      />
      
      <div className="p-4 sm:p-6 lg:p-8">
        {/* KPIs Grid - Primeira Linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total de Conversas"
            value={stats.total_conversas}
            icon={MessageSquare}
            trend={{ value: 12.5, isPositive: true }}
            iconColor="blue"
          />
          
          <StatsCard
            title="Prospects Ativos"
            value={stats.total_prospects}
            icon={Users}
            trend={{ value: 8.3, isPositive: true }}
            iconColor="green"
          />
          
          <StatsCard
            title="Matrículas do Mês"
            value={stats.matriculas_mes}
            icon={GraduationCap}
            trend={{ value: 15.2, isPositive: true }}
            iconColor="purple"
          />
          
          <StatsCard
            title="Receita do Mês"
            value={formatCurrency(stats.receita_mes)}
            icon={DollarSign}
            trend={{ value: 23.1, isPositive: true }}
            iconColor="orange"
          />
        </div>
        
        {/* Segunda Linha de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Taxa de Conversão"
            value={`${stats.taxa_conversao.toFixed(1)}%`}
            icon={TrendingUp}
            subtitle="Prospects → Matrículas"
            iconColor="red"
          />
          
          <StatsCard
            title="Taxa de Automação"
            value={`${stats.taxa_automacao.toFixed(1)}%`}
            icon={Bot}
            subtitle="Resolvido por IA"
            iconColor="indigo"
          />
          
          <StatsCard
            title="Tempo Médio Resposta"
            value={`${stats.tempo_medio_resposta}s`}
            icon={Clock}
            subtitle="Primeira resposta"
            iconColor="yellow"
          />
          
          <StatsCard
            title="Satisfação Média"
            value={`${stats.satisfacao_media.toFixed(1)}/5`}
            icon={Star}
            subtitle="Avaliação dos clientes"
            iconColor="pink"
          />
        </div>
        
        {/* Gráficos Reais */}
        <DashboardCharts faculdadeId={faculdadeSelecionada?.id} />
      </div>
    </div>
  )
}