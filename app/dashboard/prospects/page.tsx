'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Filter,
  Download,
  User,
  MapPin,
  GraduationCap,
  DollarSign
} from 'lucide-react'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { Prospect } from '@/types/supabase'

export default function ProspectsPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [cursoFilter, setCursoFilter] = useState('todos')
  const [vinculoFilter, setVinculoFilter] = useState('todos')
  const [prospectSelecionado, setProspectSelecionado] = useState<Prospect | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20

  useEffect(() => {
    if (faculdadeSelecionada) {
      fetchProspects()
    }
  }, [faculdadeSelecionada, currentPage])

  const fetchProspects = async () => {
    if (!faculdadeSelecionada) return

    try {
      setLoading(true)

      // Buscar contagem total
      const { count, error: countError } = await supabase
        .from('prospects_academicos')
        .select('*', { count: 'exact', head: true })
        .eq('faculdade_id', faculdadeSelecionada.id)

      if (!countError && count !== null) {
        setTotalCount(count)
        setTotalPages(Math.ceil(count / itemsPerPage))
      }

      // Buscar prospects paginados
      const startIndex = (currentPage - 1) * itemsPerPage
      const { data, error } = await supabase
        .from('prospects_academicos')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + itemsPerPage - 1)

      if (error) throw error

      setProspects(data || [])
    } catch (error) {
      console.error('Erro ao buscar prospects:', error)
      setProspects([])
    } finally {
      setLoading(false)
    }
  }

  const cursosUnicos = useMemo(() => {
    return Array.from(new Set(prospects.map(p => p.curso).filter(Boolean)))
  }, [prospects])

  const prospectsFiltrados = useMemo(() => {
    return prospects.filter(prospect => {
      const matchSearch = prospect.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.telefone?.includes(searchTerm)
      const matchStatus = statusFilter === 'todos' || prospect.status_academico === statusFilter
      const matchCurso = cursoFilter === 'todos' || prospect.curso === cursoFilter
      const matchVinculo = vinculoFilter === 'todos' || prospect.tipo_prospect === vinculoFilter
      return matchSearch && matchStatus && matchCurso && matchVinculo
    })
  }, [prospects, searchTerm, statusFilter, cursoFilter, vinculoFilter])

  const taxaConversao = useMemo(() => {
    const total = prospectsFiltrados.length
    const matriculados = prospectsFiltrados.filter(p => p.status_academico === 'matriculado').length
    return total > 0 ? ((matriculados / total) * 100).toFixed(1) : '0.0'
  }, [prospectsFiltrados])

  const totalValor = useMemo(() => {
    return prospectsFiltrados.reduce((sum, p) => sum + (p.valor_mensalidade || 0), 0)
  }, [prospectsFiltrados])

  const mediaNota = useMemo(() => {
    const total = prospectsFiltrados.length
    const soma = prospectsFiltrados.reduce((sum, p) => sum + (p.nota_qualificacao || 0), 0)
    return total > 0 ? soma / total : 0
  }, [prospectsFiltrados])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'novo': return 'info'
      case 'contatado': return 'warning'
      case 'qualificado': return 'secondary'
      case 'matriculado': return 'success'
      case 'perdido': return 'danger'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'novo': return 'Novo'
      case 'contatado': return 'Contatado'
      case 'qualificado': return 'Qualificado'
      case 'matriculado': return 'Matriculado'
      case 'perdido': return 'Perdido'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse" />}>
          <Header
            title="Prospects"
            subtitle="Gerencie seus prospects acadêmicos"
          />
        </Suspense>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse" />}>
        <Header
          title="Prospects"
          subtitle="Gerencie seus prospects acadêmicos"
        />
      </Suspense>

      <div className="p-8 space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Total Prospects</h3>
            <p className="text-2xl font-bold text-gray-500">{prospectsFiltrados.length}</p>
          </Card>

          <Card className="text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Taxa de Conversão</h3>
            <p className="text-2xl font-bold text-green-500">{taxaConversao}%</p>
          </Card>

          <Card className="text-center">
            <div className="text-green-500 mx-auto mb-2 text-2xl font-bold">R$</div>
            <h3 className="text-lg font-semibold">Valor Estimado</h3>
            <p className="text-2xl font-bold text-green-500">{totalValor.toLocaleString('pt-BR')}</p>
          </Card>

          <Card className="text-center">
            <div className="text-purple-500 mx-auto mb-2 text-2xl font-bold">★</div>
            <h3 className="text-lg font-semibold">Nota Média</h3>
            <p className="text-2xl font-bold text-purple-500">{mediaNota.toFixed(1)}</p>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border border-gray-200 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar prospects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 !bg-white !text-black !border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="novo">Novo</option>
                <option value="contatado">Contatado</option>
                <option value="qualificado">Qualificado</option>
                <option value="matriculado">Matriculado</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
              <select
                value={cursoFilter}
                onChange={(e) => setCursoFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                {cursosUnicos.map(curso => (
                  <option key={curso} value={curso}>{curso}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Lista de Prospects */}
        {prospectsFiltrados.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'todos' || cursoFilter !== 'todos'
                  ? 'Nenhum prospect encontrado'
                  : 'Nenhum prospect cadastrado'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'todos' || cursoFilter !== 'todos'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro prospect'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prospectsFiltrados.map((prospect) => (
              <div key={prospect.id} onClick={() => setProspectSelecionado(prospect)} className="cursor-pointer">
                <Card className="hover:shadow-lg transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{prospect.nome}</h3>
                        <Badge variant={getStatusColor(prospect.status_academico)}>
                          {getStatusLabel(prospect.status_academico)}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {prospect.telefone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{prospect.telefone}</span>
                        </div>
                      )}
                      {prospect.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{prospect.email}</span>
                        </div>
                      )}
                      {prospect.curso && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <GraduationCap className="w-4 h-4" />
                          <span>{prospect.curso}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages} ({totalCount} prospects)
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {prospectSelecionado && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setProspectSelecionado(null)}>
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <Card className="max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{prospectSelecionado.nome}</h2>
                    <Badge variant={getStatusColor(prospectSelecionado.status_academico)}>
                      {getStatusLabel(prospectSelecionado.status_academico)}
                    </Badge>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setProspectSelecionado(null)}>
                    Fechar
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prospectSelecionado.telefone && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Telefone</label>
                      <p className="text-gray-900">{prospectSelecionado.telefone}</p>
                    </div>
                  )}
                  {prospectSelecionado.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{prospectSelecionado.email}</p>
                    </div>
                  )}
                  {prospectSelecionado.curso && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Curso</label>
                      <p className="text-gray-900">{prospectSelecionado.curso}</p>
                    </div>
                  )}
                  {prospectSelecionado.valor_mensalidade && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Mensalidade</label>
                      <p className="text-gray-900">R$ {prospectSelecionado.valor_mensalidade.toLocaleString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}