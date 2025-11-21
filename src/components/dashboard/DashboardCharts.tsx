'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DashboardChartsProps {
  faculdadeId?: string
}

interface ChartsData {
  evolucaoSemanal: Array<{
    dia: string
    conversas: number
    prospects: number
    matriculas: number
  }>
  conversasPorHora: Array<{
    hora: string
    conversas: number
  }>
  setores: Array<{
    name: string
    value: number
    color: string
  }>
}

export function DashboardCharts({ faculdadeId }: DashboardChartsProps) {
  const [chartsData, setChartsData] = useState<ChartsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (faculdadeId) {
      fetchChartsData()
    } else {
      setLoading(false)
    }
  }, [faculdadeId])

  const fetchChartsData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/dashboard/charts?faculdade_id=${faculdadeId}`)
      const data = await res.json()
      setChartsData(data)
    } catch (error) {
      console.error('Erro ao buscar dados dos gráficos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!chartsData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-black">Horários de Pico</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Nenhum dado disponível
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-black">Setores Mais Acionados</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Nenhum dado disponível
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Horários de Pico */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-black">Horários de Pico</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartsData.conversasPorHora}>
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
              name="Conversas"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Setores */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-black">Setores Mais Acionados</h3>
        {chartsData.setores.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartsData.setores}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartsData.setores.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Nenhum setor com dados
          </div>
        )}
      </div>
    </div>
  )
}

