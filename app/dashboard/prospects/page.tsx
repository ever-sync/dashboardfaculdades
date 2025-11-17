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
  Target,
  DollarSign,
  BarChart2,
  Tag
} from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { Prospect } from '@/types/supabase'
import { useDebounce } from '@/lib/debounce'
import { ListSkeleton } from '@/components/ui/Skeleton'

interface ProspectView {
  id: string
  nome: string
  email?: string
  telefone: string
  cursoInteresse: string
  status: 'novo' | 'contatado' | 'qualificado' | 'matriculado' | 'perdido' | 'em_contato'
  vinculo?: 'aluno' | 'nao_aluno' | 'ex_aluno'
  dataCadastro: string
  ultimoContato: string
  valorEstimado?: number
  nota: number
}

interface ProspectDetalhado extends ProspectView {
  // Campos extras que podem existir no banco e serão exibidos no pop-up
  nome_completo?: string
  cpf?: string
  data_nascimento?: string
  tipo_prospect?: 'aluno' | 'nao_aluno' | 'ex_aluno'
  curso_pretendido?: string
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  cidade?: string
  estado?: string
  data_pagamento?: number // 5, 7 ou 10
  turno?: string
  origem_lead?: string
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
   const [vinculoFilter, setVinculoFilter] = useState<string>('todos')
  
  // Debounce do termo de busca
  const debouncedSearchTerm = useDebounce(searchTerm, 400)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20

  const [prospectSelecionado, setProspectSelecionado] = useState<ProspectDetalhado | null>(null)

  const fetchProspects = useCallback(async () => {
    if (!faculdadeSelecionada) {
      setProspects([])
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      
      // Buscar contagem total
      const { count, error: countError } = await supabase
        .from('prospects_academicos')
        .select('*', { count: 'exact', head: true })
        .eq('faculdade_id', faculdadeSelecionada.id)

      if (countError) {
        console.warn('Erro ao contar prospects:', countError.message)
      } else if (count !== null) {
        setTotalCount(count)
        setTotalPages(Math.ceil(count / itemsPerPage))
      }

      // Buscar prospects paginados - usando campos corretos do banco
      const startIndex = (currentPage - 1) * itemsPerPage
      const { data, error } = await supabase
        .from('prospects_academicos')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + itemsPerPage - 1)

      if (error) {
        // Log mais detalhado do erro
        console.error('Erro ao buscar prospects do Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        // Não lançar erro, apenas definir array vazio
        setProspects([])
        return
      }

      // Log dos dados brutos para debug
      console.log('Dados brutos do banco:', data)

      // Mapear campos do banco para a interface ProspectView
      const prospectsFormatados: ProspectView[] = (data || []).map((p: any) => {
        // Converter status_academico para status esperado
        let status: ProspectView['status'] = 'novo'
        if (p.status_academico) {
          const statusMap: Record<string, ProspectView['status']> = {
            'novo': 'novo',
            'contatado': 'contatado',
            'qualificado': 'qualificado',
            'matriculado': 'matriculado',
            'perdido': 'perdido'
          }
          status = statusMap[p.status_academico] || 'novo'
        }

        // Limpar telefone do formato WhatsApp se necessário
        let telefoneFormatado = p.telefone || 'Não informado'
        if (telefoneFormatado.includes('@s.whatsapp.net')) {
          telefoneFormatado = telefoneFormatado.replace('@s.whatsapp.net', '')
        }

        return {
          id: p.id,
          nome: p.nome || p.nome_completo || 'Sem nome',
          email: p.email || undefined,
          telefone: telefoneFormatado,
          cursoInteresse: p.curso || p.curso_pretendido || 'Não informado',
          status,
          vinculo: p.tipo_prospect || undefined,
          dataCadastro: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'N/A',
          ultimoContato: p.ultimo_contato ? new Date(p.ultimo_contato).toLocaleDateString('pt-BR') : 'N/A',
          valorEstimado: p.valor_mensalidade ? Number(p.valor_mensalidade) : undefined,
          nota: p.nota_qualificacao || 0
        }
      })

      console.log('Prospects formatados:', prospectsFormatados)
      setProspects(prospectsFormatados)
    } catch (error: any) {
      // Captura erros inesperados
      console.warn('Erro inesperado ao buscar prospects:', error?.message || error)
      setProspects([])
    } finally {
      setLoading(false)
    }
  }, [faculdadeSelecionada, currentPage, itemsPerPage])

  useEffect(() => {
    if (faculdadeSelecionada) fetchProspects()
  }, [faculdadeSelecionada, currentPage, fetchProspects])

  // Hooks devem ser chamados antes de qualquer early return
  const cursosUnicos = useMemo(() => Array.from(new Set(prospects.map(p => p.cursoInteresse))), [prospects])

  const prospectsFiltrados = useMemo(() => {
    return prospects.filter(prospect => {
      const matchSearch = prospect.nome.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         (prospect.email || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         prospect.telefone.includes(debouncedSearchTerm)
      const matchStatus = statusFilter === 'todos' || prospect.status === statusFilter
      // Vínculo não existe mais, mas mantemos o filtro para não quebrar a UI
      const matchVinculo = vinculoFilter === 'todos' // Sempre true por enquanto
      const matchCurso = cursoFilter === 'todos' || prospect.cursoInteresse === cursoFilter
      return matchSearch && matchStatus && matchCurso && matchVinculo
    })
  }, [prospects, debouncedSearchTerm, statusFilter, cursoFilter, vinculoFilter])

  const totalValor = useMemo(() => prospectsFiltrados.reduce((sum, p) => sum + (p.valorEstimado || 0), 0), [prospectsFiltrados])
  const mediaNota = useMemo(() => prospectsFiltrados.reduce((sum, p) => sum + p.nota, 0) / (prospectsFiltrados.length || 1), [prospectsFiltrados])
  const taxaConversao = useMemo(() => {
    if (!prospectsFiltrados.length) return 0
    const convertidos = prospectsFiltrados.filter(
      (p) => p.status === 'matriculado' || p.vinculo === 'aluno'
    ).length
    return Math.round((convertidos / prospectsFiltrados.length) * 100)
  }, [prospectsFiltrados])

  // Skeleton loader
  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Header
          title="Prospects"
          subtitle="Gerencie seus prospects e potenciais alunos"
        />
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="h-8 w-24 bg-gray-200 rounded mb-4 animate-pulse" />
                <div className="h-12 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <ListSkeleton items={5} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Header
        title="Prospects"
        subtitle="Gerencie seus prospects e potenciais alunos"
      />
      
      <div className="p-8 space-y-6">
        {/* Cards de Resumo */}
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
                containerClassName="mb-0 md:mt-6"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vínculo</label>
              <select
                value={vinculoFilter}
                onChange={(e) => setVinculoFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white text-black rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="aluno">Aluno</option>
                <option value="nao_aluno">Não aluno</option>
                <option value="ex_aluno">Ex-aluno</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Tabela de Prospects */}
        <Card>
          <div className="overflow-x-auto">
            {prospectsFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
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
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Contato</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Curso</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Nota</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Valor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Último Contato</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {prospectsFiltrados.map((prospect) => (
                    <tr key={prospect.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold text-gray-900">{prospect.nome}</div>
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
                          <span className="font-semibold text-gray-900">{prospect.nota.toFixed(1)}</span>
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
                          <Calendar className="w-3 h-3 text-gray-500" />
                          {prospect.ultimoContato}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              try {
                                const { data } = await supabase
                                  .from('prospects_academicos')
                                  .select('*')
                                  .eq('id', prospect.id)
                                  .single()

                                if (data) {
                                  // Converter status_academico para status esperado
                                  let status: ProspectView['status'] = 'novo'
                                  if (data.status_academico) {
                                    const statusMap: Record<string, ProspectView['status']> = {
                                      'novo': 'novo',
                                      'contatado': 'contatado',
                                      'qualificado': 'qualificado',
                                      'matriculado': 'matriculado',
                                      'perdido': 'perdido'
                                    }
                                    status = statusMap[data.status_academico] || 'novo'
                                  }

                                  // Limpar telefone do formato WhatsApp se necessário
                                  let telefoneFormatado = data.telefone || ''
                                  if (telefoneFormatado.includes('@s.whatsapp.net')) {
                                    telefoneFormatado = telefoneFormatado.replace('@s.whatsapp.net', '')
                                  }

                                  // Mapear todos os campos do banco, incluindo os novos
                                  const detalhado: ProspectDetalhado = {
                                    id: data.id,
                                    nome: data.nome || data.nome_completo || '',
                                    nome_completo: data.nome_completo || data.nome || undefined,
                                    email: data.email || undefined,
                                    telefone: telefoneFormatado,
                                    cpf: data.cpf || undefined,
                                    data_nascimento: data.data_nascimento || undefined,
                                    tipo_prospect: data.tipo_prospect || undefined,
                                    cursoInteresse: data.curso || data.curso_pretendido || 'Não informado',
                                    curso_pretendido: data.curso_pretendido || data.curso || undefined,
                                    status,
                                    dataCadastro: data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR') : 'N/A',
                                    ultimoContato: data.ultimo_contato ? new Date(data.ultimo_contato).toLocaleDateString('pt-BR') : 'N/A',
                                    valorEstimado: data.valor_mensalidade ? Number(data.valor_mensalidade) : undefined,
                                    nota: data.nota_qualificacao || 0,
                                    vinculo: data.tipo_prospect || undefined,
                                    cep: data.cep || undefined,
                                    endereco: data.endereco || undefined,
                                    numero: data.numero || undefined,
                                    complemento: data.complemento || undefined,
                                    bairro: data.bairro || undefined,
                                    municipio: data.municipio || undefined,
                                    cidade: data.cidade || undefined,
                                    estado: data.estado || undefined,
                                    data_pagamento: data.data_pagamento || undefined,
                                    turno: data.turno || undefined,
                                    origem_lead: data.origem || undefined,
                                  }

                                  console.log('Dados brutos do banco:', data)
                                  console.log('Dados formatados do prospect:', detalhado)

                                  setProspectSelecionado(detalhado)
                                }
                              } catch (error) {
                                console.warn('Erro ao buscar detalhes do prospect:', error)
                              }
                            }}
                          >
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
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 px-4">
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
                <span className="flex items-center px-3 text-sm text-gray-700 dark:text-gray-300">
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
      {/* Pop-up de detalhes do prospect */}
      {prospectSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-black">{prospectSelecionado.nome}</h2>
                <p className="text-sm text-gray-500">Detalhes completos do lead</p>
              </div>
              <Button
                variant="secondary"
                className="bg-gray-100 text-gray-800 hover:bg-gray-200"
                onClick={() => setProspectSelecionado(null)}
              >
                Fechar
              </Button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Dados Pessoais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700">Dados Pessoais</h3>
                  </div>
                  <p className="text-sm text-gray-800"><span className="font-medium">Nome:</span> {prospectSelecionado.nome}</p>
                  {prospectSelecionado.nome_completo && (
                    <p className="text-sm text-gray-800"><span className="font-medium">Nome completo:</span> {prospectSelecionado.nome_completo}</p>
                  )}
                  {prospectSelecionado.cpf && (
                    <p className="text-sm text-gray-800"><span className="font-medium">CPF:</span> {prospectSelecionado.cpf}</p>
                  )}
                  {prospectSelecionado.data_nascimento && (
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">Data de nascimento:</span>{' '}
                      {new Date(prospectSelecionado.data_nascimento).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  {prospectSelecionado.tipo_prospect && (
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">Tipo:</span>{' '}
                      {prospectSelecionado.tipo_prospect === 'aluno' ? 'Aluno' : 
                       prospectSelecionado.tipo_prospect === 'nao_aluno' ? 'Não aluno' : 
                       prospectSelecionado.tipo_prospect === 'ex_aluno' ? 'Ex-aluno' : 'N/A'}
                    </p>
                  )}
                </Card>

                <Card className="bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-semibold text-gray-700">Contato</h3>
                  </div>
                  <p className="text-sm text-gray-800"><span className="font-medium">Telefone:</span> {prospectSelecionado.telefone}</p>
                  <p className="text-sm text-gray-800"><span className="font-medium">E-mail:</span> {prospectSelecionado.email || 'N/A'}</p>
                </Card>
              </div>

              {/* Endereço */}
              {(prospectSelecionado.cep || prospectSelecionado.endereco || prospectSelecionado.bairro || prospectSelecionado.cidade) && (
                <Card className="bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-semibold text-gray-700">Endereço</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {prospectSelecionado.cep && (
                      <p className="text-sm text-gray-800"><span className="font-medium">CEP:</span> {prospectSelecionado.cep}</p>
                    )}
                    {prospectSelecionado.endereco && (
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">Endereço:</span> {prospectSelecionado.endereco}
                        {prospectSelecionado.numero && `, ${prospectSelecionado.numero}`}
                        {prospectSelecionado.complemento && ` - ${prospectSelecionado.complemento}`}
                      </p>
                    )}
                    {prospectSelecionado.bairro && (
                      <p className="text-sm text-gray-800"><span className="font-medium">Bairro:</span> {prospectSelecionado.bairro}</p>
                    )}
                    {prospectSelecionado.municipio && (
                      <p className="text-sm text-gray-800"><span className="font-medium">Município:</span> {prospectSelecionado.municipio}</p>
                    )}
                    {prospectSelecionado.cidade && (
                      <p className="text-sm text-gray-800"><span className="font-medium">Cidade:</span> {prospectSelecionado.cidade}</p>
                    )}
                    {prospectSelecionado.estado && (
                      <p className="text-sm text-gray-800"><span className="font-medium">Estado:</span> {prospectSelecionado.estado}</p>
                    )}
                  </div>
                </Card>
              )}

              {/* Curso e Funil */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-semibold text-gray-700">Curso e Funil</h3>
                  </div>
                  <p className="text-sm text-gray-800"><span className="font-medium">Curso interesse:</span> {prospectSelecionado.cursoInteresse}</p>
                  {prospectSelecionado.curso_pretendido && (
                    <p className="text-sm text-gray-800"><span className="font-medium">Curso pretendido:</span> {prospectSelecionado.curso_pretendido}</p>
                  )}
                  {prospectSelecionado.turno && (
                    <p className="text-sm text-gray-800"><span className="font-medium">Turno:</span> {prospectSelecionado.turno}</p>
                  )}
                  <p className="text-sm text-gray-800"><span className="font-medium">Status:</span> {getStatusLabel(prospectSelecionado.status)}</p>
                  {prospectSelecionado.origem_lead && (
                    <p className="text-sm text-gray-800"><span className="font-medium">Origem do lead:</span> {prospectSelecionado.origem_lead}</p>
                  )}
                </Card>

                <Card className="bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <h3 className="text-sm font-semibold text-gray-700">Financeiro e Qualificação</h3>
                  </div>
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">Valor mensalidade:</span>{' '}
                    {prospectSelecionado.valorEstimado
                      ? `R$ ${Number(prospectSelecionado.valorEstimado).toLocaleString('pt-BR')}`
                      : 'N/A'}
                  </p>
                  {prospectSelecionado.data_pagamento && (
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">Data de pagamento:</span>{' '}
                      Dia {prospectSelecionado.data_pagamento} de cada mês
                    </p>
                  )}
                  <p className="text-sm text-gray-800"><span className="font-medium">Nota de qualificação:</span> {prospectSelecionado.nota}</p>
                </Card>
              </div>

              {/* Datas */}
              <Card className="bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-gray-700">Datas e Interações</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <p className="text-sm text-gray-800"><span className="font-medium">Data cadastro:</span> {prospectSelecionado.dataCadastro}</p>
                  <p className="text-sm text-gray-800"><span className="font-medium">Último contato:</span> {prospectSelecionado.ultimoContato}</p>
                </div>
              </Card>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}