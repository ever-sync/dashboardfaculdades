'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  ChevronLeft,
  ThumbsDown,
  ThumbsUp,
  Plus,
  Phone,
  Mail,
  MessageSquare,
  User,
  Building2,
  Calendar,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Info,
  Star,
  Flag
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { useToast } from '@/contexts/ToastContext'

interface HistoricoItem {
  id: string
  tipo: string
  texto: string
  detalhe?: string
  data: string
  cor: string
}

export default function CRMDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const { faculdadeSelecionada } = useFaculdade()
  const { showToast } = useToast()
  const negociacaoId = params.id as string

  const [loading, setLoading] = useState(true)
  const [mostrarSaldo, setMostrarSaldo] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('historico')
  const [empresaExpandida, setEmpresaExpandida] = useState(false)
  const [responsavelExpandido, setResponsavelExpandido] = useState(false)
  const [saldoExpandido, setSaldoExpandido] = useState(false)

  const [negociacao, setNegociacao] = useState<any>(null)
  const [empresa, setEmpresa] = useState<any>(null)
  const [contato, setContato] = useState<any>(null)
  const [tarefas, setTarefas] = useState<any[]>([])
  const [funil, setFunil] = useState<any>(null)
  const [historico, setHistorico] = useState<HistoricoItem[]>([])

  useEffect(() => {
    if (negociacaoId && faculdadeSelecionada) {
      fetchNegociacao()
    }
  }, [negociacaoId, faculdadeSelecionada])

  const fetchNegociacao = async () => {
    if (!faculdadeSelecionada || !negociacaoId) return

    try {
      setLoading(true)

      // Buscar negociação
      const { data: negData, error: negError } = await supabase
        .from('negociacoes')
        .select('*')
        .eq('id', negociacaoId)
        .eq('faculdade_id', faculdadeSelecionada.id)
        .single()

      if (negError) {
        if (negError.code === 'PGRST116' || negError.message?.includes('does not exist')) {
          // Tabela não existe, usar dados mock
          setNegociacao(getMockNegociacao())
          setLoading(false)
          return
        }
        throw negError
      }

      if (!negData) {
        showToast('Negociação não encontrada', 'error')
        router.push('/dashboard/crm')
        return
      }

      setNegociacao(negData)

      // Buscar funil para obter etapas
      if (negData.funil_id) {
        const { data: funilData } = await supabase
          .from('funis_vendas')
          .select('*')
          .eq('id', negData.funil_id)
          .single()

        if (funilData) {
          setFunil(funilData)
        }
      }

      // Buscar empresa
      if (negData.empresa_id) {
        const { data: empresaData } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', negData.empresa_id)
          .single()

        if (empresaData) {
          setEmpresa(empresaData)
        }
      }

      // Buscar contato
      if (negData.contato_id) {
        const { data: contatoData } = await supabase
          .from('contatos')
          .select('*')
          .eq('id', negData.contato_id)
          .single()

        if (contatoData) {
          setContato(contatoData)
        }
      }

      // Buscar tarefas
      const { data: tarefasData } = await supabase
        .from('tarefas')
        .select('*')
        .eq('negociacao_id', negociacaoId)
        .order('created_at', { ascending: false })

      if (tarefasData) {
        setTarefas(tarefasData)
      }

      // Construir histórico básico
      const historicoItems: HistoricoItem[] = [
        {
          id: 'criacao',
          tipo: 'criacao',
          texto: 'Negociação criada',
          data: new Date(negData.created_at).toLocaleString('pt-BR'),
          cor: 'pink'
        }
      ]

      // Adicionar histórico de mudanças de etapa (se houver)
      if (negData.data_entrada_etapa && negData.data_entrada_etapa !== negData.created_at) {
        historicoItems.push({
          id: 'etapa',
          tipo: 'etapa',
          texto: `Etapa alterada para ${negData.etapa}`,
          data: new Date(negData.data_entrada_etapa).toLocaleString('pt-BR'),
          cor: 'gray'
        })
      }

      setHistorico(historicoItems)

    } catch (error) {
      console.error('Erro ao buscar negociação:', error)
      setNegociacao(getMockNegociacao())
    } finally {
      setLoading(false)
    }
  }

  const getMockNegociacao = () => ({
    id: negociacaoId,
    nome: 'Negociação não encontrada',
    status: 'nova',
    tags: [],
    qualificacao: 0,
    criadaEm: new Date().toLocaleDateString('pt-BR'),
    telefone: '',
    email: '',
    responsavel: '',
    etapa: 'lead',
    valor: 0
  })

  const handleMarcarPerda = async () => {
    if (!confirm('Tem certeza que deseja marcar esta negociação como perdida?')) return

    try {
      const { error } = await supabase
        .from('negociacoes')
        .update({
          status: 'perdida',
          etapa: 'perdida',
          updated_at: new Date().toISOString()
        })
        .eq('id', negociacaoId)

      if (error) throw error

      showToast('Negociação marcada como perdida!', 'success')
      await fetchNegociacao()
      router.push('/dashboard/crm')
    } catch (error: any) {
      console.error('Erro ao marcar como perdida:', error)
      showToast('Erro ao marcar como perdida: ' + error.message, 'error')
    }
  }

  const handleMarcarVenda = async () => {
    if (!confirm('Tem certeza que deseja marcar esta negociação como venda?')) return

    try {
      const { error } = await supabase
        .from('negociacoes')
        .update({
          status: 'venda',
          etapa: 'venda',
          updated_at: new Date().toISOString()
        })
        .eq('id', negociacaoId)

      if (error) throw error

      showToast('Negociação marcada como venda!', 'success')
      await fetchNegociacao()
      router.push('/dashboard/crm')
    } catch (error: any) {
      console.error('Erro ao marcar como venda:', error)
      showToast('Erro ao marcar como venda: ' + error.message, 'error')
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando negociação...</p>
        </div>
      </div>
    )
  }

  if (!negociacao) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Negociação não encontrada</p>
          <Button onClick={() => router.push('/dashboard/crm')}>
            Voltar para CRM
          </Button>
        </div>
      </div>
    )
  }

  // Construir etapas do funil
  const etapas = funil?.etapas || []
  const etapaAtual = negociacao.etapa
  const etapasFormatadas = etapas.map((etapa: any) => ({
    id: etapa.id,
    label: etapa.nome || etapa.sigla,
    dias: negociacao.dias_na_etapa || 0,
    ativo: etapa.id === etapaAtual
  }))

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header
        title=""
        subtitle=""
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Conteúdo Principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Cabeçalho */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Link href="/dashboard/crm">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{negociacao.nome}</h1>
              </div>
              <div className="flex items-center gap-2">
                {negociacao.status !== 'perdida' && negociacao.status !== 'venda' && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleMarcarPerda}
                      className="!bg-red-600 hover:!bg-red-700"
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Marcar perda
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleMarcarVenda}
                      className="!bg-green-600 hover:!bg-green-700"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Marcar venda
                    </Button>
                  </>
                )}
                {negociacao.status === 'perdida' && (
                  <Badge variant="danger" className="text-sm px-3 py-1">
                    Perdida
                  </Badge>
                )}
                {negociacao.status === 'venda' && (
                  <Badge variant="success" className="text-sm px-3 py-1 bg-green-600">
                    Venda
                  </Badge>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 mb-4">
              {negociacao.tags && negociacao.tags.length > 0 ? (
                negociacao.tags.map((tag: string, idx: number) => (
                  <Badge
                    key={idx}
                    variant="info"
                    className={idx === 0 ? 'bg-purple-600 text-white' : 'bg-teal-600 text-white'}
                  >
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">Nenhuma tag</span>
              )}
            </div>

            {/* Barra de Progresso das Etapas */}
            {etapasFormatadas.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {etapasFormatadas.map((etapa, idx) => (
                  <div
                    key={etapa.id}
                    className={`flex items-center gap-1 flex-shrink-0 ${etapa.ativo ? 'text-teal-600' : 'text-gray-400'
                      }`}
                  >
                    <div
                      className={`px-3 py-1 rounded text-xs font-medium ${etapa.ativo
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                      {etapa.label} {etapa.dias > 0 && `(${etapa.dias} dias)`}
                    </div>
                    {idx < etapasFormatadas.length - 1 && (
                      <div className={`w-8 h-0.5 ${etapa.ativo ? 'bg-teal-600' : 'bg-gray-300'}`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Abas */}
          <div className="bg-white border-b border-gray-200 px-6">
            <div className="flex items-center gap-6">
              {['Histórico', 'E-mail', 'Tarefas', 'Produtos e Serviços', 'Arquivos', 'Propostas', 'Pagamentos'].map((aba) => (
                <button
                  key={aba}
                  onClick={() => setAbaAtiva(aba.toLowerCase())}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${abaAtiva === aba.toLowerCase()
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {aba}
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo da Aba */}
          <div className="flex-1 overflow-y-auto p-6">
            {abaAtiva === 'historico' && (
              <div className="space-y-4">
                {/* Filtros */}
                <div className="flex items-center gap-3 mb-4">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
                    <option>Do RD Station CRM</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
                    <option>Exibir Todos os eventos</option>
                  </select>
                  <Button
                    variant="primary"
                    size="sm"
                    className="!bg-teal-600 hover:!bg-teal-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar anotação
                  </Button>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  {historico.length > 0 ? historico.map((evento) => (
                    <div key={evento.id} className="flex gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${evento.cor === 'pink' ? 'bg-pink-100' : 'bg-gray-100'
                        }`}>
                        {evento.cor === 'pink' ? (
                          <Flag className="w-4 h-4 text-pink-600" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 pb-4 border-b border-gray-200">
                        <p className="text-sm text-gray-900 mb-1">{evento.texto}</p>
                        {evento.detalhe && (
                          <p className="text-sm text-gray-600 mb-2">{evento.detalhe}</p>
                        )}
                        <p className="text-xs text-gray-500">{evento.data}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Nenhum histórico disponível</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {abaAtiva === 'tarefas' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tarefas</h3>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push(`/dashboard/crm/criar-tarefa?negociacao=${negociacaoId}`)}
                    className="!bg-teal-600 hover:!bg-teal-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar tarefa
                  </Button>
                </div>
                {tarefas.length > 0 ? (
                  <div className="space-y-3">
                    {tarefas.map((tarefa) => (
                      <Card key={tarefa.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{tarefa.titulo}</h4>
                            {tarefa.descricao && (
                              <p className="text-sm text-gray-600 mb-2">{tarefa.descricao}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Status: {tarefa.status}</span>
                              <span>Prioridade: {tarefa.prioridade}</span>
                              {tarefa.responsavel && <span>Responsável: {tarefa.responsavel}</span>}
                              {tarefa.prazo && (
                                <span>Prazo: {new Date(tarefa.prazo).toLocaleDateString('pt-BR')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <Calendar className="w-16 h-16 mx-auto text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-4">Não existem tarefas para essa Negociação</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => router.push(`/dashboard/crm/criar-tarefa?negociacao=${negociacaoId}`)}
                      className="!bg-teal-600 hover:!bg-teal-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar tarefa
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Direita */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          {/* Negociação */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Negociação</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Nome:</span>
                <p className="text-gray-900 font-medium">{negociacao.nome}</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <Badge variant={negociacao.status === 'venda' ? 'success' : negociacao.status === 'perdida' ? 'danger' : 'info'}>
                  {negociacao.status}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Etapa:</span>
                <p className="text-gray-900">{negociacao.etapa}</p>
              </div>
              <div>
                <span className="text-gray-500">Qualificação:</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <p className="text-gray-900">{negociacao.qualificacao || 0}</p>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Valor:</span>
                <p className="text-gray-900">R$ {negociacao.valor ? negociacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</p>
              </div>
              <div>
                <span className="text-gray-500">Criada em:</span>
                <p className="text-gray-900">{new Date(negociacao.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <span className="text-gray-500">Dias na etapa:</span>
                <p className="text-gray-900">{negociacao.dias_na_etapa || 0} dias</p>
              </div>
              {negociacao.observacoes && (
                <div>
                  <span className="text-gray-500">Observações:</span>
                  <p className="text-gray-900 text-sm">{negociacao.observacoes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contatos */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Contatos</h3>
              <Button
                variant="secondary"
                size="sm"
                className="!bg-teal-600 hover:!bg-teal-700 !text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar contato
              </Button>
            </div>
            <div className="space-y-3">
              {contato ? (
                <>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{contato.nome}</span>
                  </div>
                  {contato.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <MessageSquare
                        className="w-4 h-4 text-green-600 cursor-pointer hover:text-green-700"
                        onClick={() => router.push(`/dashboard/conversas?telefone=${contato.telefone}`)}
                      />
                      <span className="text-sm text-gray-900">{contato.telefone}</span>
                    </div>
                  )}
                  {contato.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{contato.email}</span>
                    </div>
                  )}
                  {contato.cargo && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Cargo:</span>
                      <span className="text-sm text-gray-900">{contato.cargo}</span>
                    </div>
                  )}
                </>
              ) : negociacao.telefone || negociacao.email ? (
                <>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{negociacao.nome}</span>
                  </div>
                  {negociacao.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <MessageSquare
                        className="w-4 h-4 text-green-600 cursor-pointer hover:text-green-700"
                        onClick={() => router.push(`/dashboard/conversas?telefone=${negociacao.telefone}`)}
                      />
                      <span className="text-sm text-gray-900">{negociacao.telefone}</span>
                    </div>
                  )}
                  {negociacao.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{negociacao.email}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">Nenhum contato vinculado</p>
              )}
            </div>
          </div>

          {/* Empresa */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setEmpresaExpandida(!empresaExpandida)}
              className="flex items-center justify-between w-full mb-3"
            >
              <h3 className="font-semibold text-gray-900">Empresa</h3>
              {empresaExpandida ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {empresaExpandida && (
              <div>
                {empresa ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Nome:</span>
                      <p className="text-gray-900 font-medium">{empresa.nome}</p>
                    </div>
                    {empresa.cnpj && (
                      <div>
                        <span className="text-gray-500">CNPJ:</span>
                        <p className="text-gray-900">{empresa.cnpj}</p>
                      </div>
                    )}
                    {empresa.telefone && (
                      <div>
                        <span className="text-gray-500">Telefone:</span>
                        <p className="text-gray-900">{empresa.telefone}</p>
                      </div>
                    )}
                    {empresa.email && (
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="text-gray-900">{empresa.email}</p>
                      </div>
                    )}
                    {empresa.endereco && (
                      <div>
                        <span className="text-gray-500">Endereço:</span>
                        <p className="text-gray-900">{empresa.endereco}</p>
                      </div>
                    )}
                    {empresa.cidade && empresa.estado && (
                      <div>
                        <span className="text-gray-500">Cidade/Estado:</span>
                        <p className="text-gray-900">{empresa.cidade}, {empresa.estado}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-3">
                      Não há empresa na negociação, clique no botão abaixo para associar uma empresa
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push('/dashboard/crm/criar-empresa')}
                      className="w-full !bg-teal-600 hover:!bg-teal-700 !text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar empresa
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Responsável */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setResponsavelExpandido(!responsavelExpandido)}
              className="flex items-center justify-between w-full mb-3"
            >
              <h3 className="font-semibold text-gray-900">Responsável</h3>
              {responsavelExpandido ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {responsavelExpandido && (
              <div>
                <div className="mb-2">
                  <span className="text-sm text-gray-500">Responsável:</span>
                  <p className="text-sm font-medium text-gray-900">{negociacao.responsavel || 'Não atribuído'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Saldo telefônico */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Saldo telefônico</span>
              <button
                onClick={() => setMostrarSaldo(!mostrarSaldo)}
                className="text-gray-400 hover:text-gray-600"
              >
                {mostrarSaldo ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {mostrarSaldo ? 'R$ 1.234,56' : '-----'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

