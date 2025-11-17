'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { StatsCard } from '@/components/ui/StatsCard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { FileText, TrendingUp, Users, DollarSign, Calendar, Download, Filter, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/exportRelatorio'
import { formatCurrency } from '@/lib/utils'

interface RelatorioData {
  relatorioMensal: Array<{
    mes: string
    matriculas: number
    prospects: number
    receita: number
  }>
  cursosMaisProcurados: Array<{
    curso: string
    procuras: number
    matriculas: number
  }>
  fontesLead: Array<{
    fonte: string
    leads: number
    conversao: number
  }>
  totais: {
    matriculas: number
    prospects: number
    receita: number
    taxaConversao: number
  }
}

const desempenhoEquipeMock = [
  { nome: 'Ana Silva', atendimentos: 120, conversao: 32, nota: 4.8 },
  { nome: 'Carlos Oliveira', atendimentos: 98, conversao: 28, nota: 4.5 },
  { nome: 'Beatriz Santos', atendimentos: 85, conversao: 25, nota: 4.6 },
  { nome: 'Diego Ferreira', atendimentos: 60, conversao: 20, nota: 4.2 },
]

export default function RelatoriosPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes')
  const [tipoRelatorio, setTipoRelatorio] = useState('completo')
  const [relatorioData, setRelatorioData] = useState<RelatorioData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (faculdadeSelecionada) {
      fetchRelatorioData()
    }
  }, [faculdadeSelecionada, periodoSelecionado])

  const fetchRelatorioData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/relatorios/data?faculdade_id=${faculdadeSelecionada?.id}&periodo=${periodoSelecionado}`)
      const data = await res.json()
      setRelatorioData(data)
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportar = (formato: 'pdf' | 'excel' | 'csv') => {
    if (!relatorioData) {
      alert('Nenhum dado disponível para exportar')
      return
    }

    const dados = relatorioData.relatorioMensal.map(item => ({
      Mês: item.mes,
      Matrículas: item.matriculas,
      Prospects: item.prospects,
      Receita: formatCurrency(item.receita),
    }))

    const filename = `relatorio_${periodoSelecionado}_${new Date().toISOString().split('T')[0]}`

    if (formato === 'pdf') {
      exportToPDF(dados, `Relatório ${periodoSelecionado}`, filename)
    } else if (formato === 'excel') {
      exportToExcel(dados, filename)
    } else {
      exportToCSV(dados, filename)
    }
  }

  const handleVisualizar = (relatorio: string) => {
    alert(`Visualizando ${relatorio}...`)
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Header
        title="Relatórios"
        subtitle="Análises detalhadas e relatórios gerenciais"
      />
      
             <div className="p-8 space-y-6">
        {/* Filtros e Ações */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <select 
                  value={periodoSelecionado} 
                  onChange={(e) => setPeriodoSelecionado(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
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
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
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
                
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button 
                    onClick={() => handleExportar('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Exportar PDF
                  </button>
                  <button 
                    onClick={() => handleExportar('excel')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Exportar Excel
                  </button>
                  <button 
                    onClick={() => handleExportar('csv')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Exportar CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : relatorioData ? (
          <>
            {/* Cards de Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total de Matrículas"
                value={relatorioData.totais.matriculas.toString()}
                icon={TrendingUp}
                trend={{ value: 15.2, isPositive: true }}
                subtitle="No período selecionado"
                iconColor="green"
              />
              
              <StatsCard
                title="Prospects Convertidos"
                value={relatorioData.totais.prospects.toString()}
                icon={Users}
                trend={{ value: relatorioData.totais.taxaConversao, isPositive: true }}
                subtitle={`Taxa de conversão: ${relatorioData.totais.taxaConversao.toFixed(1)}%`}
                iconColor="blue"
              />
              
              <StatsCard
                title="Receita Gerada"
                value={formatCurrency(relatorioData.totais.receita)}
                icon={DollarSign}
                trend={{ value: 22.1, isPositive: true }}
                subtitle="Valor bruto"
                iconColor="orange"
              />
              
              <StatsCard
                title="Relatórios Gerados"
                value="1"
                icon={FileText}
                trend={{ value: 5.3, isPositive: true }}
                subtitle="Este mês"
                iconColor="purple"
              />
            </div>

            {/* Gráfico de Desempenho Mensal */}
                   <Card title="Desempenho Mensal" subtitle="Evolução das métricas principais">
              {relatorioData.relatorioMensal.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={relatorioData.relatorioMensal}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="matriculas" stroke="#10b981" strokeWidth={3} name="Matrículas" />
                    <Line yAxisId="left" type="monotone" dataKey="prospects" stroke="#6b7280" strokeWidth={2} name="Prospects" />
                    <Line yAxisId="right" type="monotone" dataKey="receita" stroke="#f59e0b" strokeWidth={2} name="Receita (R$)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                       <div className="h-96 flex items-center justify-center text-gray-500">
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cursos Mais Procurados */}
                     <Card title="Cursos Mais Procurados" subtitle="Top cursos por interesse">
                <div className="space-y-4">
                  {relatorioData.cursosMaisProcurados.length > 0 ? relatorioData.cursosMaisProcurados.map((curso, index) => (
                           <div key={curso.curso} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                               <div>
                                 <h4 className="font-semibold text-black">{curso.curso}</h4>
                                 <p className="text-sm text-gray-600">{curso.procuras} procuras</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{curso.matriculas} matr.</p>
                    <p className="text-xs text-gray-500">{((curso.matriculas / curso.procuras) * 100).toFixed(1)}% conv.</p>
                  </div>
                </div>
                  )) : (
                             <div className="text-center py-8 text-gray-500">
                      Nenhum curso encontrado
                    </div>
                  )}
                </div>
              </Card>

              {/* Fontes de Leads */}
                     <Card title="Fontes de Leads" subtitle="Origem dos prospects">
                {relatorioData.fontesLead.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                           <BarChart data={relatorioData.fontesLead}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fonte" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="leads" fill="#6b7280" name="Leads" />
                      <Bar dataKey="conversao" fill="#10b981" name="Conversão (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                         <div className="h-96 flex items-center justify-center text-gray-500">
                    Nenhuma fonte de lead encontrada
                  </div>
                )}
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Nenhum dado disponível
          </div>
        )}

        {/* Desempenho da Equipe */}
        <Card title="Desempenho da Equipe" subtitle="Ranking de atendimento por colaborador">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Colaborador</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Atendimentos</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Taxa Conversão</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Nota Média</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Desempenho</th>
                </tr>
              </thead>
              <tbody>
                {desempenhoEquipeMock.map((membro, index) => (
                  <tr key={membro.nome} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-sm text-gray-600">
                          {membro.nome.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-black">{membro.nome}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-black font-semibold">{membro.atendimentos}</td>
                    <td className="text-center py-3 px-4">
                      <span className="text-green-600 font-semibold">{membro.conversao}%</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-black font-semibold">{membro.nota}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            index === 0 ? 'bg-green-500' :
                            index === 1 ? 'bg-gray-500' :
                            index === 2 ? 'bg-purple-500' :
                            'bg-gray-400'
                          }`} 
                          style={{ width: `${100 - (index * 15)}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Relatórios Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div onClick={() => handleVisualizar('relatorio-matriculas')}>
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Relatório de Matrículas</h3>
            <p className="text-gray-600 text-sm">Detalhamento completo das matrículas por curso e período</p>
            <button className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
              Visualizar
            </button>
          </Card>
          </div>

          <div onClick={() => handleVisualizar('relatorio-conversao')}>
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Relatório de Conversão</h3>
            <p className="text-gray-600 text-sm">Análise da taxa de conversão por fonte e curso</p>
            <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Visualizar
            </button>
          </Card>
          </div>

          <div onClick={() => handleVisualizar('relatorio-financeiro')}>
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <DollarSign className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Relatório Financeiro</h3>
            <p className="text-gray-600 text-sm">Receitas, descontos e projeções financeiras</p>
            <button className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
              Visualizar
            </button>
          </Card>
        </div>

        {/* Resumo Executivo */}
        <Card title="Resumo Executivo" subtitle="Principais insights do período">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-black mb-3">Principais Destaques</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Crescimento de 15,2% nas matrículas comparado ao mês anterior</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>WhatsApp continua sendo a principal fonte de leads (35,6%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Engenharia Civil mantém liderança em interesse dos candidatos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">⚠</span>
                  <span>Tempo médio de resposta aumentou 8% - necessário atenção</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-black mb-3">Recomendações</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-gray-500 mt-1">→</span>
                  <span>Implementar treinamento para reduzir tempo de resposta</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500 mt-1">→</span>
                  <span>Intensificar campanhas para cursos com menor procura</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500 mt-1">→</span>
                  <span>Criar programa de incentivo a indicações (melhor conversão)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500 mt-1">→</span>
                  <span>Otimizar processo de qualificação de leads</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
  )
}