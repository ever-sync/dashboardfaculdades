'use client'

import { useState, Suspense } from 'react'
import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  BarChart,
  Calendar,
  Download,
  Filter,
  Eye,
  TrendingUp,
  Users,
  MessageSquare,
  DollarSign
} from 'lucide-react'

export default function RelatoriosPage() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes')
  const [tipoRelatorio, setTipoRelatorio] = useState('completo')

  const handleVisualizar = (tipo: string) => {
    console.log('Visualizar', tipo)
  }

  const handleExportar = (formato: string) => {
    console.log('Exportar', formato)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse" />}>
        <Header
          title="Relatórios"
          subtitle="Análise detalhada de desempenho"
        />
      </Suspense>

      <main className="p-8">
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <select
                value={periodoSelecionado}
                onChange={(e) => setPeriodoSelecionado(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800 bg-white"
              >
                <option value="dia">Último Dia</option>
                <option value="semana">Última Semana</option>
                <option value="mes">Último Mês</option>
                <option value="trimestre">Último Trimestre</option>
                <option value="ano">Último Ano</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={tipoRelatorio}
                onChange={(e) => setTipoRelatorio(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800 bg-white"
              >
                <option value="completo">Relatório Completo</option>
                <option value="vendas">Vendas</option>
                <option value="atendimento">Atendimento</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleVisualizar('relatorio')}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Visualizar
            </button>

            <div className="relative group">
              <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4" />
                Exportar
              </button>

              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[150px]">
                <button
                  onClick={() => handleExportar('pdf')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm"
                >
                  PDF
                </button>
                <button
                  onClick={() => handleExportar('excel')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm"
                >
                  Excel
                </button>
                <button
                  onClick={() => handleExportar('csv')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm"
                >
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Total de Vendas</h3>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">R$ 45.231,89</span>
              <span className="text-green-600 text-sm font-medium">+20.1%</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Novos Alunos</h3>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">+2350</span>
              <span className="text-green-600 text-sm font-medium">+180.1%</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Atendimentos</h3>
              <MessageSquare className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">+12,234</span>
              <span className="text-green-600 text-sm font-medium">+19%</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Taxa de Conversão</h3>
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">+573</span>
              <span className="text-green-600 text-sm font-medium">+201 since last hour</span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visão Geral</h3>
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">Gráfico de Visão Geral</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Desempenho por Curso</h3>
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">Gráfico de Desempenho</p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}