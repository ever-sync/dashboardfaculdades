'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { 
  Plus, 
  Filter, 
  RefreshCw, 
  BarChart3,
  ChevronLeft,
  Info,
  Star,
  User,
  Calendar,
  Bell,
  MoreVertical,
  Search,
  Settings,
  Download,
  Pencil,
  MessageCircle,
  MessageSquare,
  Sparkles,
  Building2,
  ChevronDown
} from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { useToast } from '@/contexts/ToastContext'
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/exportRelatorio'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface NegociacaoCard {
  id: string
  nome: string
  status: 'nova' | 'em_andamento' | 'negociacao' | 'venda' | 'perdida'
  etapa: 'lead' | '1_contato' | '2_contato' | '3_contato' | 'respondeu' | 'negociacao' | 'pre_venda' | 'previdas' | 'venda' | 'total_cont' | 'perdida'
  qualificacao: number
  valor?: number
  responsavel?: string
  tags: string[]
  diasNaEtapa: number
  criadaEm: string
  telefone?: string
  conversaId?: string
}


const etapasDefault = [
  { id: 'lead', label: 'LEAD', color: 'bg-gray-100 text-gray-700' },
  { id: '1_contato', label: '1 CONTATO', color: 'bg-blue-100 text-blue-700' },
  { id: '2_contato', label: '2 CONTATO', color: 'bg-purple-100 text-purple-700' },
  { id: '3_contato', label: '3 CONTATO', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'respondeu', label: 'RESPONDEU', color: 'bg-green-100 text-green-700' },
]

export default function CRMPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const { showToast } = useToast()
  const router = useRouter()
  
  // Mock data para demonstração
  const mockNegociacoesData: NegociacaoCard[] = [
    {
      id: '1',
      nome: 'MARIA AUXILIADORA SANTOS DE JESUS',
      status: 'em_andamento',
      etapa: '1_contato',
      qualificacao: 1,
      valor: 0,
      responsavel: 'João Lucas Santos',
      tags: ['ISENÇÃO DE IR', 'RD STATION MARKETING'],
      diasNaEtapa: 0,
      criadaEm: '2025-11-18',
      telefone: '5511999999999',
      conversaId: 'conv-1'
    },
    {
      id: '2',
      nome: 'Antonio Ruppel ferreira',
      status: 'em_andamento',
      etapa: '1_contato',
      qualificacao: 2,
      valor: 0,
      tags: ['ISENÇÃO DE IR'],
      diasNaEtapa: 0,
      criadaEm: '2025-11-18',
      telefone: '5511888888888',
      conversaId: 'conv-2'
    },
    {
      id: '3',
      nome: 'Edna Silva Monteiro',
      status: 'em_andamento',
      etapa: '1_contato',
      qualificacao: 3,
      valor: 0,
      tags: ['ISENÇÃO DE IR'],
      diasNaEtapa: 0,
      criadaEm: '2025-11-18',
      telefone: '5511777777777',
      conversaId: 'conv-3'
    },
  ]

  const [negociacoes, setNegociacoes] = useState<NegociacaoCard[]>([])
  const [etapas, setEtapas] = useState(etapasDefault)
  const [loading, setLoading] = useState(true)
  const [filtroNegociacoes, setFiltroNegociacoes] = useState('Todas as negociações')
  const [filtroStatus, setFiltroStatus] = useState('Todos os status')
  const [filtroOrdenacao, setFiltroOrdenacao] = useState('Criadas por último')
  const [searchTerm, setSearchTerm] = useState('')
  const [showConfigMenu, setShowConfigMenu] = useState(false)
  const [showCriarMenu, setShowCriarMenu] = useState(false)
  const [draggedCard, setDraggedCard] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const configMenuRef = useRef<HTMLDivElement>(null)
  const criarMenuRef = useRef<HTMLDivElement>(null)

  // Buscar negociações e funis do banco
  const fetchNegociacoes = useCallback(async () => {
    if (!faculdadeSelecionada) {
      setNegociacoes([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Buscar funis para obter etapas dinâmicas
      const { data: funisData } = await supabase
        .from('funis_vendas')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(1)

      // Se houver funil, usar suas etapas
      if (funisData && funisData.length > 0 && funisData[0].etapas) {
        const etapasFunil = (funisData[0].etapas as any[]).map((etapa: any, index: number) => ({
          id: etapa.id || `etapa-${index}`,
          label: etapa.nome || etapa.sigla,
          color: etapasDefault[index]?.color || 'bg-gray-100 text-gray-700'
        }))
        if (etapasFunil.length > 0) {
          setEtapas(etapasFunil)
        }
      }

      // Buscar negociações
      let query = supabase
        .from('negociacoes')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)

      // Aplicar filtros
      if (filtroStatus !== 'Todos os status') {
        const statusMap: Record<string, string> = {
          'Nova': 'nova',
          'Em andamento': 'em_andamento',
          'Negociação': 'negociacao',
          'Venda': 'venda',
          'Perdida': 'perdida'
        }
        if (statusMap[filtroStatus]) {
          query = query.eq('status', statusMap[filtroStatus])
        }
      }

      // Aplicar ordenação
      if (filtroOrdenacao === 'Criadas por último') {
        query = query.order('created_at', { ascending: false })
      } else if (filtroOrdenacao === 'Criadas por primeiro') {
        query = query.order('created_at', { ascending: true })
      } else if (filtroOrdenacao === 'Maior valor') {
        query = query.order('valor', { ascending: false })
      } else if (filtroOrdenacao === 'Menor valor') {
        query = query.order('valor', { ascending: true })
      }

      const { data, error } = await query

      if (error) {
        // Verificar se é um erro de tabela não encontrada (não é crítico)
        const isTableNotFound = 
          error.code === 'PGRST116' || 
          error.code === '42P01' ||
          error.message?.includes('does not exist') ||
          error.message?.includes('relation') ||
          error.message?.includes('table')
        
        if (!isTableNotFound) {
          // Só logar erros reais, não erros de tabela não encontrada
          const errorMessage = error.message || 'Erro desconhecido'
          const errorCode = error.code || 'N/A'
          console.error('Erro ao buscar negociações:', {
            message: errorMessage,
            code: errorCode,
            details: error.details || 'Sem detalhes',
            hint: error.hint || 'Sem hint'
          })
        }
        
        // Se a tabela não existe, usar dados mock
        if (isTableNotFound) {
          setNegociacoes(mockNegociacoesData)
        } else {
          setNegociacoes([])
        }
      } else if (data) {
        // Transformar dados do banco para o formato esperado
        const negociacoesFormatadas: NegociacaoCard[] = data.map((n: any) => {
          // Calcular dias na etapa
          const dataEntrada = n.data_entrada_etapa ? new Date(n.data_entrada_etapa) : new Date(n.created_at)
          const agora = new Date()
          const diffMs = agora.getTime() - dataEntrada.getTime()
          const diasNaEtapa = Math.floor(diffMs / (1000 * 60 * 60 * 24))

          return {
            id: n.id,
            nome: n.nome,
            status: n.status as any,
            etapa: n.etapa as any,
            qualificacao: n.qualificacao || 0,
            valor: parseFloat(n.valor) || 0,
            responsavel: n.responsavel,
            tags: n.tags || [],
            diasNaEtapa,
            criadaEm: new Date(n.created_at).toLocaleDateString('pt-BR'),
            telefone: n.telefone,
            conversaId: n.conversa_id
          }
        })
        setNegociacoes(negociacoesFormatadas)
      } else {
        setNegociacoes([])
      }
    } catch (error: any) {
      // Tratar erros inesperados
      const errorMessage = error?.message || 'Erro desconhecido ao buscar negociações'
      const errorCode = error?.code || 'N/A'
      
      // Verificar se é um erro de tabela não encontrada
      const isTableNotFound = 
        errorCode === 'PGRST116' || 
        errorCode === '42P01' ||
        errorMessage?.includes('does not exist') ||
        errorMessage?.includes('relation') ||
        errorMessage?.includes('table')
      
      if (!isTableNotFound) {
        console.error('Erro ao buscar negociações:', {
          message: errorMessage,
          code: errorCode,
          error: error
        })
      }
      
      setNegociacoes(mockNegociacoesData)
    } finally {
      setLoading(false)
    }
  }, [faculdadeSelecionada, filtroStatus, filtroOrdenacao])

  useEffect(() => {
    fetchNegociacoes()
  }, [fetchNegociacoes])

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (configMenuRef.current && !configMenuRef.current.contains(event.target as Node)) {
        setShowConfigMenu(false)
      }
      if (criarMenuRef.current && !criarMenuRef.current.contains(event.target as Node)) {
        setShowCriarMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCard(cardId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, etapaId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(etapaId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, etapaId: string) => {
    e.preventDefault()
    if (!draggedCard || !faculdadeSelecionada) return

    const negociacao = negociacoes.find(n => n.id === draggedCard)
    if (!negociacao) return

    // Atualizar estado local imediatamente
    setNegociacoes(prev => prev.map(card => 
      card.id === draggedCard 
        ? { ...card, etapa: etapaId as any, diasNaEtapa: 0 }
        : card
    ))

    // Salvar no banco
    try {
      const { error } = await supabase
        .from('negociacoes')
        .update({
          etapa: etapaId,
          data_entrada_etapa: new Date().toISOString(),
          dias_na_etapa: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', draggedCard)

      if (error) {
        console.error('Erro ao atualizar etapa:', error)
        // Reverter mudança local em caso de erro
        setNegociacoes(prev => prev.map(card => 
          card.id === draggedCard 
            ? negociacao
            : card
        ))
        alert('Erro ao atualizar etapa da negociação')
      }
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error)
      // Reverter mudança local
      setNegociacoes(prev => prev.map(card => 
        card.id === draggedCard 
          ? negociacao
          : card
      ))
    }

    setDraggedCard(null)
    setDragOverColumn(null)
  }

  const handleExportar = (formato: 'pdf' | 'excel' | 'csv') => {
    if (negociacoes.length === 0) {
      showToast('Nenhuma negociação para exportar', 'warning')
      return
    }

    const dados = negociacoes.map(n => ({
      'Nome': n.nome,
      'Status': n.status,
      'Etapa': n.etapa,
      'Qualificação': n.qualificacao,
      'Valor': n.valor ? `R$ ${n.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
      'Responsável': n.responsavel || '-',
      'Tags': n.tags.join(', ') || '-',
      'Dias na Etapa': n.diasNaEtapa,
      'Criada em': n.criadaEm
    }))

    const filename = `crm_negociacoes_${new Date().toISOString().split('T')[0]}`

    if (formato === 'pdf') {
      const columns = Object.keys(dados[0] || {}).map(key => ({ header: key, dataKey: key }))
      exportToPDF({ title: 'Relatório de Negociações CRM', filename, columns, data: dados })
      showToast('Exportação em PDF iniciada', 'success')
    } else if (formato === 'excel') {
      exportToExcel({ filename, sheetName: 'Negociações', data: dados })
      showToast('Exportação em Excel concluída', 'success')
    } else {
      exportToCSV({ filename, data: dados })
      showToast('Exportação em CSV concluída', 'success')
    }
  }

  const handlePersonalizarCartoes = () => {
    showToast('Funcionalidade de personalização de cartões em desenvolvimento. Em breve você poderá customizar os campos exibidos nos cards.', 'info', 6000)
  }

  const handleFeedback = () => {
    const feedback = prompt('Por favor, compartilhe seu feedback sobre o CRM:')
    if (feedback && feedback.trim()) {
      showToast('Obrigado pelo seu feedback!', 'success')
      // Aqui você pode enviar o feedback para uma API ou salvar no banco
      console.log('Feedback recebido:', feedback)
    }
  }

  const handleWhatsAppClick = (e: React.MouseEvent, negociacao: NegociacaoCard) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (negociacao.conversaId) {
      router.push(`/dashboard/conversas?conversa=${negociacao.conversaId}`)
    } else if (negociacao.telefone) {
      // Buscar ou criar conversa pelo telefone
      router.push(`/dashboard/conversas?telefone=${negociacao.telefone}`)
    }
  }

  const negociacoesFiltradas = negociacoes.filter(n => {
    if (filtroStatus !== 'Todos os status') {
      const statusMap: Record<string, string> = {
        'Nova': 'nova',
        'Em andamento': 'em_andamento',
        'Negociação': 'negociacao',
        'Venda': 'venda',
        'Perdida': 'perdida'
      }
      if (n.status !== statusMap[filtroStatus]) return false
    }
    if (searchTerm) {
      if (!n.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false
    }
    return true
  })

  const negociacoesPorEtapa = etapas.map(etapa => ({
    ...etapa,
    negociacoes: negociacoesFiltradas.filter(n => n.etapa === etapa.id)
  }))

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header
        title="CRM"
        subtitle="Gestão de Negociações"
      />

      {/* Barra de Filtros e Ações */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col gap-4">
          {/* Primeira linha: Botão Meus Atendimentos e Ações */}
          <div className="flex items-center justify-between">
            <Button
              variant="primary"
              size="sm"
              className="!bg-teal-600 hover:!bg-teal-700 !text-white justify-between"
            >
              <span>Meus Atendimentos ({negociacoesFiltradas.length})</span>
              <ChevronDown className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
              >
                <Calendar className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              
              {/* Botão Configuração */}
              <div className="relative" ref={configMenuRef}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowConfigMenu(!showConfigMenu)}
                  className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
                
                {showConfigMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <div className="relative group/submenu">
                        <button
                          onClick={() => setShowConfigMenu(false)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Exportar
                          </div>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover/submenu:opacity-100 group-hover/submenu:visible transition-all z-20 min-w-[150px]">
                          <button
                            onClick={() => handleExportar('pdf')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Exportar PDF
                          </button>
                          <button
                            onClick={() => handleExportar('excel')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Exportar Excel
                          </button>
                          <button
                            onClick={() => handleExportar('csv')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Exportar CSV
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowConfigMenu(false)
                          window.location.reload()
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Recarregar
                      </button>
                      <button
                        onClick={() => {
                          setShowConfigMenu(false)
                          router.push('/dashboard/crm/configurar-funil')
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Configurar Funil
                      </button>
                      <button
                        onClick={() => {
                          setShowConfigMenu(false)
                          handlePersonalizarCartoes()
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Personalizar cartões
                      </button>
                      <button
                        onClick={() => {
                          setShowConfigMenu(false)
                          handleFeedback()
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Dê seu feedback
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botão Criar com Dropdown */}
              <div className="relative" ref={criarMenuRef}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCriarMenu(!showCriarMenu)}
                  className="!bg-teal-600 hover:!bg-teal-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar
                </Button>
                
                {showCriarMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowCriarMenu(false)
                          router.push('/dashboard/crm/criar-negociacao')
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Criar Negociação
                      </button>
                      <button
                        onClick={() => {
                          setShowCriarMenu(false)
                          router.push('/dashboard/crm/criar-contato')
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        Criar Contato
                      </button>
                      <button
                        onClick={() => {
                          setShowCriarMenu(false)
                          router.push('/dashboard/crm/criar-empresa')
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Building2 className="w-4 h-4" />
                        Criar Empresa
                      </button>
                      <button
                        onClick={() => {
                          setShowCriarMenu(false)
                          router.push('/dashboard/crm/criar-tarefa')
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Criar Tarefa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Segunda linha: Filtros */}
          <div className="flex items-center gap-2">
            <select
              value={filtroNegociacoes}
              onChange={(e) => setFiltroNegociacoes(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-gray-300 focus:border-transparent"
            >
              <option>Todas as negociações</option>
              <option>Minhas negociações</option>
              <option>Negociações da equipe</option>
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-gray-300 focus:border-transparent"
            >
              <option>Todos os status</option>
              <option>Nova</option>
              <option>Em andamento</option>
              <option>Negociação</option>
              <option>Venda</option>
              <option>Perdida</option>
            </select>

            <select
              value={filtroOrdenacao}
              onChange={(e) => setFiltroOrdenacao(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-gray-300 focus:border-transparent"
            >
              <option>Criadas por último</option>
              <option>Criadas por primeiro</option>
              <option>Maior valor</option>
              <option>Menor valor</option>
            </select>

            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 !bg-white !text-black text-sm"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros (0)
            </Button>
          </div>
        </div>
      </div>

      {/* Área do Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Carregando negociações...</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 h-full min-w-max">
            {negociacoesPorEtapa.map((coluna) => (
            <div
              key={coluna.id}
              className="flex flex-col bg-white rounded-lg border border-gray-200 w-80 flex-shrink-0"
            >
              {/* Cabeçalho da Coluna */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{coluna.label}</h3>
                  <Badge variant="info" className="text-xs">
                    ({coluna.negociacoes.length})
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    R$ {coluna.negociacoes.reduce((sum, n) => sum + (n.valor || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <BarChart3 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Cards da Coluna */}
              <div 
                className={`flex-1 overflow-y-auto p-2 space-y-2 ${dragOverColumn === coluna.id ? 'bg-blue-50' : ''}`}
                onDragOver={(e) => handleDragOver(e, coluna.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, coluna.id)}
              >
                {coluna.negociacoes.map((negociacao) => (
                  <div
                    key={negociacao.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, negociacao.id)}
                    className={`cursor-move ${draggedCard === negociacao.id ? 'opacity-50' : ''}`}
                  >
                    <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer bg-white border border-gray-200">
                      {/* Status e Info */}
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={negociacao.status === 'em_andamento' ? 'info' : 'default'}
                          className="text-xs"
                        >
                          {negociacao.status === 'em_andamento' ? 'Em andamento' : negociacao.status}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {/* Ícone WhatsApp */}
                          {negociacao.telefone && (
                            <button
                              onClick={(e) => handleWhatsAppClick(e, negociacao)}
                              className="p-1 hover:bg-green-100 rounded text-green-600"
                              title="Abrir conversa no WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Info className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>

                      {/* Nome */}
                      <Link href={`/dashboard/crm/${negociacao.id}`}>
                        <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 hover:text-teal-600">
                          {negociacao.nome}
                        </h4>
                      </Link>

                      {/* Qualificação e Responsável */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-gray-600">{negociacao.qualificacao}</span>
                        </div>
                        {negociacao.responsavel && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{negociacao.responsavel}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {negociacao.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {negociacao.tags.slice(0, 2).map((tag, idx) => (
                            <Badge
                              key={idx}
                              variant="info"
                              className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Botão Criar Tarefa */}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full !bg-gray-50 hover:!bg-gray-100 !text-gray-700 text-xs"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          router.push(`/dashboard/crm/criar-tarefa?negociacao=${negociacao.id}`)
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Criar Tarefa
                      </Button>
                    </Card>
                  </div>
                ))}

                {/* Card vazio quando não há negociações */}
                {coluna.negociacoes.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Nenhuma negociação
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  )
}


