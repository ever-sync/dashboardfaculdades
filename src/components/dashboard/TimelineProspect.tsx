'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  Clock, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Loader2,
  History
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Prospect, ConversaWhatsApp, Mensagem } from '@/types/supabase'

interface TimelineItem {
  id: string
  tipo: 'conversa' | 'chamada' | 'email' | 'interacao'
  titulo: string
  descricao: string
  timestamp: string
  duracao?: number
  status?: string
  setor?: string
  atendente?: string
  mensagens?: number
  primeiraVez?: boolean
}

interface TimelineProspectProps {
  prospectId?: string | null
  telefone?: string | null
  faculdadeId: string
  conversaAtualId?: string | null
}

// Função auxiliar para formatar tempo relativo
const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSecs < 60) return 'há alguns segundos'
  if (diffMins < 60) return `há ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
  if (diffHours < 24) return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  if (diffDays < 30) return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
  if (diffMonths < 12) return `há ${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}`
  return `há ${diffYears} ${diffYears === 1 ? 'ano' : 'anos'}`
}

// Função auxiliar para formatar data completa
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

// Função auxiliar para formatar duração
const formatDuracao = (segundos?: number): string => {
  if (!segundos) return 'N/A'
  const mins = Math.floor(segundos / 60)
  const secs = segundos % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

export function TimelineProspect({
  prospectId,
  telefone,
  faculdadeId,
  conversaAtualId,
}: TimelineProspectProps) {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [primeiraVez, setPrimeiraVez] = useState(false)

  useEffect(() => {
    if ((prospectId || telefone) && faculdadeId) {
      carregarTimeline()
    } else {
      setTimelineItems([])
      setPrimeiraVez(false)
    }
  }, [prospectId, telefone, faculdadeId, conversaAtualId])

  const carregarTimeline = async () => {
    if (!prospectId && !telefone) return

    setLoading(true)

    try {
      // Buscar todas as conversas do prospect
      let queryConversas = supabase
        .from('conversas_whatsapp')
        .select('*')
        .eq('faculdade_id', faculdadeId)
        .order('created_at', { ascending: false })

      if (prospectId) {
        queryConversas = queryConversas.eq('prospect_id', prospectId)
      } else if (telefone) {
        // Limpar telefone para busca (remover caracteres especiais)
        const telefoneLimpo = telefone.replace(/\D/g, '')
        queryConversas = queryConversas.or(`telefone.ilike.%${telefoneLimpo}%,telefone.ilike.%${telefone}%`)
      }

      const { data: conversas, error: conversasError } = await queryConversas

      if (conversasError) {
        console.error('Erro ao buscar conversas:', conversasError)
        setTimelineItems([])
        return
      }

      // Buscar contagem de mensagens por conversa
      const conversaIds = (conversas || []).map(c => c.id)
      const { data: mensagensCount, error: mensagensError } = await supabase
        .from('mensagens')
        .select('conversa_id')
        .in('conversa_id', conversaIds)

      if (mensagensError) {
        console.error('Erro ao buscar mensagens:', mensagensError)
      }

      // Contar mensagens por conversa
      const mensagensPorConversa: Record<string, number> = {}
      ;(mensagensCount || []).forEach((m: any) => {
        mensagensPorConversa[m.conversa_id] = (mensagensPorConversa[m.conversa_id] || 0) + 1
      })

      // Ordenar conversas por data
      const conversasOrdenadas = (conversas || []).sort((a, b) => {
        const dataA = new Date(a.created_at).getTime()
        const dataB = new Date(b.created_at).getTime()
        return dataB - dataA
      })

      // Determinar se é primeira vez ou retorno
      const totalConversas = conversasOrdenadas.length
      const primeiraConversa = conversasOrdenadas[totalConversas - 1]
      const ehPrimeiraVez = primeiraConversa?.id === conversaAtualId || totalConversas === 1

      setPrimeiraVez(ehPrimeiraVez)

      // Converter conversas em itens de timeline
      const items: TimelineItem[] = conversasOrdenadas.map((conversa, index) => {
        const isPrimeira = index === conversasOrdenadas.length - 1
        const mensagensCount = mensagensPorConversa[conversa.id] || 0
        const statusConversa = conversa.status_conversa || conversa.status || 'pendente'
        
        let statusLabel = statusConversa
        if (statusConversa === 'ativa' || statusConversa === 'ativo') statusLabel = 'Ativa'
        if (statusConversa === 'encerrada' || statusConversa === 'encerrado') statusLabel = 'Encerrada'
        if (statusConversa === 'pendente') statusLabel = 'Pendente'

        return {
          id: conversa.id,
          tipo: 'conversa',
          titulo: isPrimeira ? 'Primeira Conversa' : `Conversa #${totalConversas - index}`,
          descricao: conversa.ultima_mensagem || 'Sem mensagens',
          timestamp: conversa.created_at || conversa.updated_at,
          duracao: conversa.duracao_segundos,
          status: statusLabel,
          setor: conversa.setor,
          atendente: conversa.atendente,
          mensagens: mensagensCount,
          primeiraVez: isPrimeira,
        }
      })

      // TODO: Adicionar chamadas e emails quando essas funcionalidades forem implementadas
      // Por enquanto, apenas conversas

      setTimelineItems(items)
    } catch (error: any) {
      console.error('Erro ao carregar timeline:', error)
      setTimelineItems([])
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'conversa':
        return <MessageSquare className="w-4 h-4" />
      case 'chamada':
        return <Phone className="w-4 h-4" />
      case 'email':
        return <Mail className="w-4 h-4" />
      default:
        return <History className="w-4 h-4" />
    }
  }

  const getIconColor = (tipo: string, primeiraVez?: boolean) => {
    if (primeiraVez) return 'text-green-600 bg-green-100'
    switch (tipo) {
      case 'conversa':
        return 'text-blue-600 bg-blue-100'
      case 'chamada':
        return 'text-purple-600 bg-purple-100'
      case 'email':
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      )
    }

    if (timelineItems.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <History className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium text-gray-600">Nenhuma interação encontrada</p>
          <p className="text-xs text-gray-500 mt-1">Este contato ainda não possui histórico de conversas</p>
        </div>
      )
    }

    return (
      <div className="space-y-4 overflow-x-hidden">
        {timelineItems.map((item, index) => {
          const isExpanded = expandedItems.has(item.id)
          const isAtual = item.id === conversaAtualId

          return (
            <div
              key={item.id}
              className={`relative pl-8 sm:pl-10 pb-4 border-l-2 ${
                isAtual ? 'border-green-500' : 'border-gray-200'
              } ${index === timelineItems.length - 1 ? '' : 'pb-6'}`}
            >
              {/* Ponto da timeline */}
              <div
                className={`absolute left-0 top-0 -translate-x-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${getIconColor(
                  item.tipo,
                  item.primeiraVez
                )} ${isAtual ? 'ring-2 ring-green-500 ring-offset-2' : ''} transition-all`}
              >
                {getIcon(item.tipo)}
              </div>

              {/* Conteúdo do item */}
              <div
                className={`bg-white rounded-lg border ${
                  isAtual ? 'border-green-500 shadow-md' : 'border-gray-200 shadow-sm'
                } p-3 sm:p-4 hover:shadow-md transition-shadow`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="font-semibold text-sm text-gray-900 break-words">{item.titulo}</h4>
                      <div className="flex items-center gap-1 flex-wrap">
                        {isAtual && (
                          <Badge variant="success" className="text-xs px-2 py-0.5">
                            Atual
                          </Badge>
                        )}
                        {item.primeiraVez && (
                          <Badge variant="info" className="text-xs px-2 py-0.5">
                            Primeira
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span className="whitespace-nowrap">{formatTimeAgo(new Date(item.timestamp))}</span>
                      </div>
                      {item.duracao && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">{formatDuracao(item.duracao)}</span>
                        </div>
                      )}
                      {item.mensagens !== undefined && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">{item.mensagens} {item.mensagens === 1 ? 'mensagem' : 'mensagens'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleExpand(item.id)}
                    className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700 flex-shrink-0 self-start sm:self-auto"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Descrição */}
                <p className="text-sm text-gray-700 mb-2 break-words">
                  {item.descricao || 'Sem mensagens'}
                </p>

                {/* Informações expandidas */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-xs text-gray-600">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {item.status && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                          <span className="font-medium text-gray-700">Status:</span>
                          <Badge variant="info" className="text-xs px-2 py-0.5 w-fit">
                            {item.status}
                          </Badge>
                        </div>
                      )}
                      {item.setor && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                          <span className="font-medium text-gray-700">Setor:</span>
                          <span className="text-gray-600">{item.setor}</span>
                        </div>
                      )}
                      {item.atendente && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                          <span className="font-medium text-gray-700">Atendente:</span>
                          <span className="text-gray-600">{item.atendente}</span>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span className="font-medium text-gray-700">Data:</span>
                        <span className="text-gray-600">{formatDate(item.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (!prospectId && !telefone) {
    return null
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <History className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900">Timeline de Interações</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {primeiraVez && (
              <Badge variant="success" className="text-xs px-2 py-1">
                Primeira Vez
              </Badge>
            )}
            {!primeiraVez && timelineItems.length > 1 && (
              <Badge variant="info" className="text-xs px-2 py-1">
                Retorno ({timelineItems.length - 1} conversas anteriores)
              </Badge>
            )}
          </div>
        </div>

        {renderContent()}

        {/* Resumo */}
        {timelineItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-lg text-gray-900 mb-1">{timelineItems.length}</div>
                <div className="text-xs text-gray-600 font-medium">Total de Conversas</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-lg text-gray-900 mb-1">
                  {timelineItems.reduce((sum, item) => sum + (item.mensagens || 0), 0)}
                </div>
                <div className="text-xs text-gray-600 font-medium">Total de Mensagens</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-bold text-lg text-gray-900 mb-1">
                  {formatDuracao(
                    timelineItems.reduce((sum, item) => sum + (item.duracao || 0), 0)
                  )}
                </div>
                <div className="text-xs text-gray-600 font-medium">Tempo Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

