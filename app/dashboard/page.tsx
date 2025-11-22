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
  GraduationCap,
  DollarSign,
  Bot,
  Clock,
  Star
} from 'lucide-react'
import { Suspense } from 'react'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'

export default function DashboardPage() {
  const { faculdadeSelecionada } = useFaculdade()

  // Mock data - replace with real data fetching
  const stats: DashboardStats = {
    total_conversas: 1250,
    total_prospects: 850,
    matriculas_mes: 45,
    taxa_conversao: 15.2,
    receita_mes: 150000,
    taxa_automacao: 45.5,
    tempo_medio_resposta: 120,
    satisfacao_media: 4.8
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse" />}>
        <Header
          title="Dashboard"
          subtitle="Visão geral da sua faculdade"
        />
      </Suspense>

      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total de Conversas"
            value={stats.total_conversas}
            icon={MessageSquare}
            trend={{ value: 12.5, isPositive: true }}
            iconColor="gray"
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
            trend={{ value: 5.2, isPositive: true }}
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
      </main>
    </div>
  )
}