'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Calendar, Clock, Send, X, AlertCircle } from 'lucide-react'
import { MensagemAgendada } from '@/types/supabase'

interface AgendarMensagemProps {
  isOpen: boolean
  onClose: () => void
  conversaId?: string
  telefone?: string
  nomeContato?: string
  faculdadeId: string
  onAgendar: (mensagem: Omit<MensagemAgendada, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}

export function AgendarMensagem({
  isOpen,
  onClose,
  conversaId,
  telefone,
  nomeContato,
  faculdadeId,
  onAgendar,
}: AgendarMensagemProps) {
  const [conteudo, setConteudo] = useState('')
  const [dataAgendamento, setDataAgendamento] = useState('')
  const [horaAgendamento, setHoraAgendamento] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Gerar data/hora padrão (próximas 2 horas)
  const getDefaultDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 2)
    const data = now.toISOString().split('T')[0]
    const hora = now.toTimeString().split(':').slice(0, 2).join(':')
    return { data, hora }
  }

  // Inicializar data/hora quando o modal abre
  const handleOpen = () => {
    if (!dataAgendamento && !horaAgendamento) {
      const { data, hora } = getDefaultDateTime()
      setDataAgendamento(data)
      setHoraAgendamento(hora)
    }
    setErro(null)
  }

  // Resetar quando abrir
  if (isOpen && !dataAgendamento) {
    handleOpen()
  }

  const handleAgendar = async () => {
    if (!conteudo.trim()) {
      setErro('O conteúdo da mensagem é obrigatório')
      return
    }

    if (!dataAgendamento || !horaAgendamento) {
      setErro('Data e hora são obrigatórias')
      return
    }

    // Combinar data e hora em ISO string
    const dataHora = new Date(`${dataAgendamento}T${horaAgendamento}:00`)
    
    if (isNaN(dataHora.getTime())) {
      setErro('Data e hora inválidas')
      return
    }

    // Verificar se a data é no futuro
    if (dataHora <= new Date()) {
      setErro('A data e hora devem ser no futuro')
      return
    }

    if (!telefone) {
      setErro('Telefone é obrigatório')
      return
    }

    setLoading(true)
    setErro(null)

    try {
      const mensagemAgendada: Omit<MensagemAgendada, 'id' | 'created_at' | 'updated_at'> = {
        faculdade_id: faculdadeId,
        conversa_id: conversaId,
        telefone,
        conteudo: conteudo.trim(),
        tipo_mensagem: 'texto',
        data_agendamento: dataHora.toISOString(),
        status: 'pendente',
        remetente: 'agente',
        tentativas: 0,
      }

      await onAgendar(mensagemAgendada)

      // Resetar formulário
      setConteudo('')
      const { data, hora } = getDefaultDateTime()
      setDataAgendamento(data)
      setHoraAgendamento(hora)
      onClose()
    } catch (error: any) {
      console.error('Erro ao agendar mensagem:', error)
      setErro(error.message || 'Erro ao agendar mensagem')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl mx-4 p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Agendar Mensagem</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {nomeContato && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Para:</p>
            <p className="font-medium text-gray-900">{nomeContato}</p>
            {telefone && (
              <p className="text-sm text-gray-600">{telefone}</p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conteúdo da Mensagem *
            </label>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Digite a mensagem que deseja agendar..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent !bg-white !text-black resize-none"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              {conteudo.length} caracteres
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data *
              </label>
              <Input
                type="date"
                value={dataAgendamento}
                onChange={(e) => setDataAgendamento(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora *
              </label>
              <Input
                type="time"
                value={horaAgendamento}
                onChange={(e) => setHoraAgendamento(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {dataAgendamento && horaAgendamento && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  Mensagem será enviada em:{' '}
                  <strong className="text-gray-900">
                    {new Date(`${dataAgendamento}T${horaAgendamento}:00`).toLocaleString('pt-BR', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {erro && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{erro}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleAgendar}
              disabled={loading || !conteudo.trim() || !dataAgendamento || !horaAgendamento}
              className="!bg-gray-900 hover:!bg-gray-800"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Agendando...' : 'Agendar Mensagem'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

