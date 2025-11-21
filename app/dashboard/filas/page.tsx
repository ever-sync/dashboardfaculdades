'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Clock,
  MessageSquare,
  User,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'
// Função auxiliar para formatar tempo relativo em português
const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'há alguns segundos'
  if (diffMins < 60) return `há ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
  if (diffHours < 24) return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
}

interface ConversaFila {
  id: string
  nome: string
  telefone: string
  ultima_mensagem?: string
  data_ultima_mensagem: string
  setor?: string
  faculdade_id: string
  created_at: string
  tempo_espera: number // em minutos
}

interface EstatisticasFila {
  total: number
  tempo_medio_espera: number
  mais_antiga: number // minutos
}

export default function FilasPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const [conversasPorSetor, setConversasPorSetor] = useState<Record<string, ConversaFila[]>>({})
  const [estatisticas, setEstatisticas] = useState<Record<string, EstatisticasFila>>({})
  const [loading, setLoading] = useState(true)
  const [atribuindo, setAtribuindo] = useState<string | null>(null)
  const [setores] = useState(['Vendas', 'Suporte', 'Atendimento'])

  const calcularTempoEspera = useCallback((dataCriacao: string, dataUltimaMensagem: string): number => {
    const agora = new Date()
    const ultimaMensagem = new Date(dataUltimaMensagem || dataCriacao)
    const diffMs = agora.getTime() - ultimaMensagem.getTime()
    return Math.floor(diffMs / (1000 * 60)) // Retorna em minutos
  }, [])

  const calcularEstatisticas = useCallback((conversas: ConversaFila[]): EstatisticasFila => {
    if (conversas.length === 0) {
      return { total: 0, tempo_medio_espera: 0, mais_antiga: 0 }
    }

    const tempoTotal = conversas.reduce((sum, conv) => sum + conv.tempo_espera, 0)
    const tempoMedio = Math.floor(tempoTotal / conversas.length)
    const maisAntiga = Math.max(...conversas.map(conv => conv.tempo_espera))

    return {
      total: conversas.length,
      tempo_medio_espera: tempoMedio,
      mais_antiga: maisAntiga,
    }
  }, [])

  const fetchConversasNaoAtribuidas = useCallback(async () => {
    if (!faculdadeSelecionada) {
      setConversasPorSetor({})
      setEstatisticas({})
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Buscar todas as conversas da faculdade primeiro
      let queryBase = supabase
        .from('conversas_whatsapp')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)

      const { data: todasConversasData, error: errorBase } = await queryBase

      let conversas: any[] = []

      if (errorBase) {
        console.error('Erro ao buscar conversas:', {
          message: errorBase.message,
          details: errorBase.details,
          hint: errorBase.hint,
          code: errorBase.code,
          error: errorBase
        })
        // Tentar com query mais simples
        const { data: conversasSimples, error: errorSimples } = await supabase
          .from('conversas_whatsapp')
          .select('*')
          .eq('faculdade_id', faculdadeSelecionada.id)
          .limit(100)

        if (errorSimples) {
          console.error('Erro na query simples:', errorSimples)
          setConversasPorSetor({})
          setEstatisticas({})
          setLoading(false)
          return
        }

        // Usar dados simples
        conversas = (conversasSimples || [])
          .filter((conv: any) => {
            // Filtrar conversas não atribuídas (sem atendente_id ou atendente null)
            const semAtendenteId = !conv.atendente_id || conv.atendente_id === null
            const semAtendente = !conv.atendente || conv.atendente === null || conv.atendente === ''
            const statusValido = !conv.status_conversa || ['ativa', 'pendente'].includes(conv.status_conversa)
            return (semAtendenteId || semAtendente) && statusValido
          })
          .sort((a: any, b: any) => {
            const dataA = new Date(a.data_ultima_mensagem || a.created_at || 0).getTime()
            const dataB = new Date(b.data_ultima_mensagem || b.created_at || 0).getTime()
            return dataA - dataB
          })
      } else {
        // Processar conversas normalmente
        conversas = (todasConversasData || [])
          .filter((conv: any) => {
            // Filtrar conversas não atribuídas (sem atendente_id ou atendente null)
            const semAtendenteId = !conv.atendente_id || conv.atendente_id === null
            const semAtendente = !conv.atendente || conv.atendente === null || conv.atendente === ''
            const statusValido = !conv.status_conversa || ['ativa', 'pendente'].includes(conv.status_conversa)
            return (semAtendenteId || semAtendente) && statusValido
          })
          .sort((a: any, b: any) => {
            const dataA = new Date(a.data_ultima_mensagem || a.created_at || 0).getTime()
            const dataB = new Date(b.data_ultima_mensagem || b.created_at || 0).getTime()
            return dataA - dataB // Mais antigas primeiro
          })
      }

      // Agrupar por setor
      const conversasPorSetorMap: Record<string, ConversaFila[]> = {}
      const conversasFormatadas: ConversaFila[] = (conversas || []).map((conv: any) => {
        const tempoEspera = calcularTempoEspera(
          conv.created_at,
          conv.data_ultima_mensagem || conv.created_at
        )

        return {
          id: conv.id,
          nome: conv.nome,
          telefone: conv.telefone,
          ultima_mensagem: conv.ultima_mensagem,
          data_ultima_mensagem: conv.data_ultima_mensagem || conv.created_at,
          setor: conv.setor || 'Atendimento',
          faculdade_id: conv.faculdade_id,
          created_at: conv.created_at,
          tempo_espera: tempoEspera,
        }
      })

      // Agrupar por setor
      conversasFormatadas.forEach((conv) => {
        const setor = conv.setor || 'Atendimento'
        if (!conversasPorSetorMap[setor]) {
          conversasPorSetorMap[setor] = []
        }
        conversasPorSetorMap[setor].push(conv)
      })

      // Garantir que todos os setores existam
      setores.forEach((setor) => {
        if (!conversasPorSetorMap[setor]) {
          conversasPorSetorMap[setor] = []
        }
      })

      setConversasPorSetor(conversasPorSetorMap)

      // Calcular estatísticas por setor
      const stats: Record<string, EstatisticasFila> = {}
      Object.keys(conversasPorSetorMap).forEach((setor) => {
        stats[setor] = calcularEstatisticas(conversasPorSetorMap[setor])
      })
      setEstatisticas(stats)
    } catch (error: any) {
      console.error('Erro ao buscar conversas:', error)
    } finally {
      setLoading(false)
    }
  }, [faculdadeSelecionada, calcularTempoEspera, calcularEstatisticas, setores])

  const handlePegarConversa = useCallback(async (conversaId: string, setor: string) => {
    if (!faculdadeSelecionada) return

    try {
      setAtribuindo(conversaId)

      // Atribuir automaticamente usando a API de atribuição
      const response = await fetch('/api/conversas/atribuir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversa_id: conversaId,
          faculdade_id: faculdadeSelecionada.id,
          setor: setor,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atribuir conversa')
      }

      // Recarregar filas
      await fetchConversasNaoAtribuidas()
    } catch (error: any) {
      console.error('Erro ao pegar conversa:', error)
      alert('Erro ao atribuir conversa: ' + error.message)
    } finally {
      setAtribuindo(null)
    }
  }, [faculdadeSelecionada, fetchConversasNaoAtribuidas])

  useEffect(() => {
    fetchConversasNaoAtribuidas()

    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchConversasNaoAtribuidas, 10000)

    return () => clearInterval(interval)
  }, [fetchConversasNaoAtribuidas])

  // Supabase Realtime subscription para atualizar em tempo real
  useEffect(() => {
    if (!faculdadeSelecionada) return

    const channel = supabase
      .channel('filas-conversas')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas_whatsapp',
          filter: `faculdade_id=eq.${faculdadeSelecionada.id}`,
        },
        () => {
          fetchConversasNaoAtribuidas()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [faculdadeSelecionada, fetchConversasNaoAtribuidas])

  const formatarTempoEspera = (minutos: number): string => {
    if (minutos < 60) {
      return `${minutos} min`
    }
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return `${horas}h ${mins}min`
  }

  const getBadgeColor = (minutos: number): 'success' | 'warning' | 'destructive' => {
    if (minutos < 5) return 'success'
    if (minutos < 15) return 'warning'
    return 'destructive'
  }

  if (!faculdadeSelecionada) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Selecione uma faculdade
            </h3>
            <p className="text-gray-600">
              Por favor, selecione uma faculdade para visualizar as filas de atendimento.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Filas de Atendimento</h1>
        <p className="text-gray-600">
          Visualize e gerencie conversas não atribuídas por setor
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {setores.map((setor) => {
          const stats = estatisticas[setor] || { total: 0, tempo_medio_espera: 0, mais_antiga: 0 }
          return (
            <Card key={setor} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{setor}</h3>
                <Badge variant={stats.total > 0 ? 'warning' : 'success'}>
                  {stats.total} {stats.total === 1 ? 'conversa' : 'conversas'}
                </Badge>
              </div>
              {stats.total > 0 ? (
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Tempo médio: {formatarTempoEspera(stats.tempo_medio_espera)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Mais antiga: {formatarTempoEspera(stats.mais_antiga)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Nenhuma conversa aguardando</span>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Lista de Conversas por Setor */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {setores.map((setor) => {
            const conversas = conversasPorSetor[setor] || []
            
            return (
              <Card key={setor} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{setor}</h2>
                  <Badge variant={conversas.length > 0 ? 'warning' : 'success'}>
                    {conversas.length}
                  </Badge>
                </div>

                {conversas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Nenhuma conversa aguardando</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {conversas.map((conversa) => (
                      <div
                        key={conversa.id}
                        className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {conversa.nome}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              {conversa.telefone}
                            </p>
                          </div>
                          <Badge variant={getBadgeColor(conversa.tempo_espera)}>
                            {formatarTempoEspera(conversa.tempo_espera)}
                          </Badge>
                        </div>

                        {conversa.ultima_mensagem && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {conversa.ultima_mensagem}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(new Date(conversa.data_ultima_mensagem))}
                          </span>
                        </div>

                        <Button
                          onClick={() => handlePegarConversa(conversa.id, setor)}
                          disabled={atribuindo === conversa.id}
                          size="sm"
                          className="w-full !bg-gray-900 hover:!bg-gray-800"
                        >
                          {atribuindo === conversa.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Atribuindo...</span>
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4" />
                              <span>Pegar Conversa</span>
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

