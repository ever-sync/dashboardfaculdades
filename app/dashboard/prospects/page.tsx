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
  Download
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { Prospect } from '@/types/supabase'

interface ProspectView {
  id: string
  nome: string
  email?: string
  telefone: string
  cursoInteresse: string
  status: 'novo' | 'contatado' | 'qualificado' | 'matriculado' | 'perdido' | 'em_contato'
  dataCadastro: string
  ultimoContato: string
  valorEstimado?: number
  nota: number
}

const mockProspects: ProspectView[] = [
  {
    id: '1',
    nome: 'Ana Silva',
    email: 'ana.silva@email.com',
    telefone: '(11) 98765-4321',
    cursoInteresse: 'Engenharia Civil',
    status: 'qualificado',
    dataCadastro: '2024-01-15',
    ultimoContato: '2024-01-20',
    valorEstimado: 2500,
    nota: 8.5
  },
  {
    id: '2',
    nome: 'Carlos Oliveira',
    email: 'carlos.oliveira@email.com',
    telefone: '(21) 99876-5432',
    cursoInteresse: 'Administração',
    status: 'em_contato',
    dataCadastro: '2024-01-18',
    ultimoContato: '2024-01-19',
    valorEstimado: 1800,
    nota: 7.2
  },
  {
    id: '3',
    nome: 'Beatriz Santos',
    email: 'beatriz.santos@email.com',
    telefone: '(31) 91234-5678',
    cursoInteresse: 'Direito',
    status: 'novo',
    dataCadastro: '2024-01-20',
    ultimoContato: '2024-01-20',
    valorEstimado: 2200,
    nota: 9.1
  },
  {
    id: '4',
    nome: 'Diego Ferreira',
    email: 'diego.ferreira@email.com',
    telefone: '(41) 92345-6789',
    cursoInteresse: 'Medicina',
    status: 'matriculado',
    dataCadastro: '2024-01-10',
    ultimoContato: '2024-01-15',
    valorEstimado: 4500,
    nota: 9.8
  },
  {
    id: '5',
    nome: 'Elaine Costa',
    email: 'elaine.costa@email.com',
    telefone: '(51) 93456-7890',
    cursoInteresse: 'Psicologia',
    status: 'perdido',
    dataCadastro: '2024-01-05',
    ultimoContato: '2024-01-12',
    valorEstimado: 1900,
    nota: 6.3
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'novo': return 'info'
    case 'contatado': return 'warning'
    case 'qualificado': return 'warning'
    case 'matriculado': return 'success'
    case 'perdido': return 'danger'
    default: return 'info'
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

export default function ProspectsPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const [prospects, setProspects] = useState<ProspectView[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [cursoFilter, setCursoFilter] = useState<string>('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20

  useEffect(() => {
    if (faculdadeSelecionada) fetchProspects()
  }, [faculdadeSelecionada, currentPage])

  const fetchProspects = async () => {
    try {
      setLoading(true)
      
      // Buscar contagem total
      const { count } = await supabase
        .from('prospects_academicos')
        .select('*', { count: 'exact', head: true })
        .eq('faculdade_id', faculdadeSelecionada?.id as string)

      if (count) {
        setTotalCount(count)
        setTotalPages(Math.ceil(count / itemsPerPage))
      }

      // Buscar prospects paginados
      const startIndex = (currentPage - 1) * itemsPerPage
      const { data, error } = await supabase
        .from('prospects_academicos')
        .select('id, nome, email, telefone, curso, status_academico, created_at, ultimo_contato, valor_mensalidade, nota_qualificacao')
        .eq('faculdade_id', faculdadeSelecionada?.id as string)
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + itemsPerPage - 1)

      if (error) throw error

      const prospectsFormatados: ProspectView[] = (data || []).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        email: p.email,
        telefone: p.telefone,
        cursoInteresse: p.curso || 'Não informado',
        status: p.status_academico || 'novo',
        dataCadastro: new Date(p.created_at).toLocaleDateString('pt-BR'),
        ultimoContato: p.ultimo_contato ? new Date(p.ultimo_contato).toLocaleDateString('pt-BR') : 'N/A',
        valorEstimado: p.valor_mensalidade,
        nota: p.nota_qualificacao || 0
      }))

      setProspects(prospectsFormatados)
    } catch (error) {
      console.error('Erro ao buscar prospects:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Header
          title="Prospects"
          subtitle="Gerencie seus prospects e potenciais alunos"
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  const cursosUnicos = useMemo(() => Array.from(new Set(prospects.map(p => p.cursoInteresse))), [prospects])

  const prospectsFiltrados = useMemo(() => {
    return prospects.filter(prospect => {
      const matchSearch = prospect.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (prospect.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.telefone.includes(searchTerm)
      const matchStatus = statusFilter === 'todos' || prospect.status === statusFilter
      const matchCurso = cursoFilter === 'todos' || prospect.cursoInteresse === cursoFilter
      return matchSearch && matchStatus && matchCurso
    })
  }, [prospects, searchTerm, statusFilter, cursoFilter])

  const totalValor = useMemo(() => prospectsFiltrados.reduce((sum, p) => sum + (p.valorEstimado || 0), 0), [prospectsFiltrados])
  const mediaNota = useMemo(() => prospectsFiltrados.reduce((sum, p) => sum + p.nota, 0) / (prospectsFiltrados.length || 1), [prospectsFiltrados])

  return (
    <div>
      <Header
        title="Prospects"
        subtitle="Gerencie seus prospects e potenciais alunos"
      />
      
      <div className="p-8 space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Total Prospects</h3>
            <p className="text-2xl font-bold text-blue-500">{prospectsFiltrados.length}</p>
          </Card>
          
          <Card className="text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Taxa de Conversão</h3>
            <p className="text-2xl font-bold text-green-500">23%</p>
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
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar prospects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-gray-800"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                {cursosUnicos.map(curso => (
                  <option key={curso} value={curso}>{curso}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <Button variant="secondary" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabela de Prospects */}
        <Card>
          <div className="overflow-x-auto">
            {prospectsFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {searchTerm || statusFilter !== 'todos' || cursoFilter !== 'todos' ? 'Nenhum prospect encontrado' : 'Nenhum prospect disponível'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'todos' || cursoFilter !== 'todos' 
                    ? 'Tente ajustar seus filtros de busca' 
                    : 'Os prospects aparecerão aqui assim que forem cadastrados'}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Contato</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Curso</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Nota</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Valor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Último Contato</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {prospectsFiltrados.map((prospect) => (
                    <tr key={prospect.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold text-gray-800">{prospect.nome}</div>
                          <div className="text-sm text-gray-600">ID: {prospect.id}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <Phone className="w-3 h-3 text-gray-500" />
                            {prospect.telefone}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <Mail className="w-3 h-3 text-gray-500" />
                            {prospect.email || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-800">{prospect.cursoInteresse}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusColor(prospect.status)}>
                          {getStatusLabel(prospect.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span className="font-semibold text-gray-800">{prospect.nota.toFixed(1)}</span>
                          <span className="text-yellow-400 ml-1">★</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-green-600">
                          R$ {(prospect.valorEstimado || 0).toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {prospect.ultimoContato}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm">
                            Ver
                          </Button>
                          <Button size="sm">
                            Contato
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Controles de Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t px-4">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} prospects
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-3 text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}