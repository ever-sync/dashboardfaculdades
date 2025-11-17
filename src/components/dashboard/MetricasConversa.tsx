'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Clock, 
  MessageSquare, 
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Mensagem, ConversaWhatsApp } from '@/types/supabase'

interface MetricasConversaProps {
  conversaId: string
  mensagens: Mensagem[]
  conversaDetalhes?: ConversaWhatsApp | null
}

// Função auxiliar para calcular tempo médio de resposta
const calcularTempoMedioResposta = (mensagens: Mensagem[]): number | null => {
  if (mensagens.length < 2) return null

  // Filtrar apenas mensagens do cliente
  const mensagensCliente = mensagens.filter(m => {
    const remetente = (m.remetente || '').toLowerCase()
    return remetente === 'cliente' || remetente === 'usuario'
  })

  if (mensagensCliente.length === 0) return null

  // Para cada mensagem do cliente, encontrar a próxima mensagem do atendente
  let totalTempoResposta = 0
  let contadorRespostas = 0

  for (let i = 0; i < mensagensCliente.length; i++) {
    const mensagemCliente = mensagensCliente[i]
    const timestampCliente = new Date(mensagemCliente.timestamp || mensagemCliente.created_at).getTime()

    // Buscar próxima mensagem do atendente após esta mensagem do cliente
    const proximaMensagemAtendente = mensagens.find(m => {
      const timestampM = new Date(m.timestamp || m.created_at).getTime()
      const remetente = (m.remetente || '').toLowerCase()
      const isAtendente = remetente === 'humano' || remetente === 'agente' || remetente === 'robo' || remetente === 'bot'
      return timestampM > timestampCliente && isAtendente
    })

    if (proximaMensagemAtendente) {
      const timestampAtendente = new Date(proximaMensagemAtendente.timestamp || proximaMensagemAtendente.created_at).getTime()
      const tempoResposta = timestampAtendente - timestampCliente
      totalTempoResposta += tempoResposta
      contadorRespostas++
    }
  }

  if (contadorRespostas === 0) return null

  return Math.floor(totalTempoResposta / contadorRespostas / 1000) // Retornar em segundos
}

// Função auxiliar para formatar duração
const formatDuracao = (segundos: number): string => {
  if (segundos < 60) return `${segundos}s`
  const mins = Math.floor(segundos / 60)
  const secs = segundos % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hours = Math.floor(mins / 60)
  const minsRestantes = mins % 60
  return `${hours}h ${minsRestantes}m`
}

// Função auxiliar para formatar tempo de resposta
const formatTempoResposta = (segundos: number): string => {
  if (segundos < 60) return `${segundos}s`
  const mins = Math.floor(segundos / 60)
  const secs = segundos % 60
  if (mins < 60) return `${mins}m ${secs > 0 ? `${secs}s` : ''}`
  const hours = Math.floor(mins / 60)
  const minsRestantes = mins % 60
  return `${hours}h ${minsRestantes > 0 ? `${minsRestantes}m` : ''}`
}

export function MetricasConversa({
  conversaId,
  mensagens,
  conversaDetalhes,
}: MetricasConversaProps) {
  const [tempoMedioResposta, setTempoMedioResposta] = useState<number | null>(null)
  const [duracaoConversa, setDuracaoConversa] = useState<number>(0)
  const [dentroDaMeta, setDentroDaMeta] = useState<boolean | null>(null)
  const [metaTempoResposta] = useState(120) // 2 minutos em segundos
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (conversaId && mensagens.length > 0) {
      calcularMetricas()
    } else {
      setTempoMedioResposta(null)
      setDuracaoConversa(0)
      setDentroDaMeta(null)
    }
  }, [conversaId, mensagens])

  useEffect(() => {
    if (conversaDetalhes?.duracao_segundos) {
      setDuracaoConversa(conversaDetalhes.duracao_segundos)
    } else if (mensagens.length > 0) {
      // Calcular duração baseada na primeira e última mensagem
      const primeiraMensagem = mensagens[mensagens.length - 1]
      const ultimaMensagem = mensagens[0]
      
      const timestampPrimeira = new Date(primeiraMensagem.timestamp || primeiraMensagem.created_at).getTime()
      const timestampUltima = new Date(ultimaMensagem.timestamp || ultimaMensagem.created_at).getTime()
      
      const duracao = Math.floor((timestampUltima - timestampPrimeira) / 1000)
      setDuracaoConversa(duracao > 0 ? duracao : 0)
    }
  }, [conversaDetalhes, mensagens])

  const calcularMetricas = () => {
    if (mensagens.length === 0) return

    // Calcular tempo médio de resposta
    const tempoMedio = calcularTempoMedioResposta(mensagens)
    setTempoMedioResposta(tempoMedio)

    // Verificar se está dentro da meta
    if (tempoMedio !== null) {
      setDentroDaMeta(tempoMedio <= metaTempoResposta)
    } else {
      setDentroDaMeta(null)
    }
  }

  const totalMensagens = mensagens.length
  const mensagensCliente = mensagens.filter(m => {
    const remetente = (m.remetente || '').toLowerCase()
    return remetente === 'cliente' || remetente === 'usuario'
  }).length
  const mensagensAtendente = mensagens.filter(m => {
    const remetente = (m.remetente || '').toLowerCase()
    return remetente === 'humano' || remetente === 'agente' || remetente === 'robo' || remetente === 'bot'
  }).length

  return (
    <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          Métricas da Conversa
        </h3>
        {dentroDaMeta !== null && (
          <Badge variant={dentroDaMeta ? 'success' : 'warning'} className="text-xs">
            {dentroDaMeta ? (
              <>
                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                Dentro da Meta
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Acima da Meta
              </>
            )}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Tempo Médio de Resposta */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-600">Tempo Médio de Resposta</span>
          </div>
          {tempoMedioResposta !== null ? (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold text-gray-900">
                {formatTempoResposta(tempoMedioResposta)}
              </span>
              {dentroDaMeta !== null && (
                <span className={`text-xs ${dentroDaMeta ? 'text-green-600' : 'text-orange-600'}`}>
                  {dentroDaMeta ? '✓' : '⚠'}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-500">N/A</span>
          )}
          <div className="text-xs text-gray-500 mt-1">
            Meta: {formatTempoResposta(metaTempoResposta)}
          </div>
        </div>

        {/* Duração da Conversa */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-gray-600">Duração Total</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">
            {duracaoConversa > 0 ? formatDuracao(duracaoConversa) : 'N/A'}
          </span>
        </div>

        {/* Total de Mensagens */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-gray-600">Total de Mensagens</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">{totalMensagens}</span>
          <div className="text-xs text-gray-500 mt-1">
            Cliente: {mensagensCliente} | Atendente: {mensagensAtendente}
          </div>
        </div>

        {/* Taxa de Resposta */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-gray-600">Taxa de Resposta</span>
          </div>
          {totalMensagens > 0 ? (
            <span className="text-lg font-semibold text-gray-900">
              {Math.round((mensagensAtendente / mensagensCliente) * 100) || 0}%
            </span>
          ) : (
            <span className="text-sm text-gray-500">N/A</span>
          )}
          <div className="text-xs text-gray-500 mt-1">
            {mensagensAtendente} respostas / {mensagensCliente} solicitações
          </div>
        </div>
      </div>
    </Card>
  )
}

