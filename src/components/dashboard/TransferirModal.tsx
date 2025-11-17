'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Usuario } from '@/types/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Users, Building2, ArrowRight, Loader2 } from 'lucide-react'

interface TransferirModalProps {
  isOpen: boolean
  onClose: () => void
  conversaId: string
  faculdadeId: string
  setorAtual?: string
  atendenteAtual?: string
  onTransferir: () => void
}

export function TransferirModal({
  isOpen,
  onClose,
  conversaId,
  faculdadeId,
  setorAtual,
  atendenteAtual,
  onTransferir,
}: TransferirModalProps) {
  const [setores] = useState(['Vendas', 'Suporte', 'Atendimento'])
  const [setorDestino, setSetorDestino] = useState<string>('')
  const [atendenteDestino, setAtendenteDestino] = useState<string>('')
  const [atendentes, setAtendentes] = useState<Usuario[]>([])
  const [loadingAtendentes, setLoadingAtendentes] = useState(false)
  const [transferirParaSetor, setTransferirParaSetor] = useState(true)
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar atendentes quando mudar setor ou modo
  useEffect(() => {
    if (!isOpen) return

    const carregarAtendentes = async () => {
      if (!transferirParaSetor && setorDestino) {
        setLoadingAtendentes(true)
        try {
          const { data, error: errorAtendentes } = await supabase
            .from('usuarios')
            .select('*')
            .eq('faculdade_id', faculdadeId)
            .eq('setor', setorDestino)
            .eq('ativo', true)
            .eq('status', 'online')
            .order('nome')

          if (errorAtendentes) {
            console.error('Erro ao carregar atendentes:', errorAtendentes)
            setAtendentes([])
          } else {
            setAtendentes(data || [])
          }
        } catch (err) {
          console.error('Erro ao carregar atendentes:', err)
          setAtendentes([])
        } finally {
          setLoadingAtendentes(false)
        }
      } else {
        setAtendentes([])
      }
    }

    carregarAtendentes()
  }, [isOpen, transferirParaSetor, setorDestino, faculdadeId])

  // Resetar ao fechar
  useEffect(() => {
    if (!isOpen) {
      setSetorDestino('')
      setAtendenteDestino('')
      setMotivo('')
      setError(null)
      setTransferirParaSetor(true)
    }
  }, [isOpen])

  const handleTransferir = async () => {
    if (transferirParaSetor && !setorDestino) {
      setError('Selecione um setor de destino')
      return
    }

    if (!transferirParaSetor && !atendenteDestino) {
      setError('Selecione um atendente de destino')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/conversas/transferir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversa_id: conversaId,
          faculdade_id: faculdadeId,
          setor_origem: setorAtual || 'Atendimento',
          setor_destino: transferirParaSetor ? setorDestino : undefined,
          atendente_destino: !transferirParaSetor ? atendenteDestino : undefined,
          motivo: motivo || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao transferir conversa')
      }

      onTransferir()
      onClose()
    } catch (err: any) {
      console.error('Erro ao transferir conversa:', err)
      setError(err.message || 'Erro ao transferir conversa')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ArrowRight className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Transferir Conversa</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Modo de Transferência */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Transferir para:
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setTransferirParaSetor(true)
                  setAtendenteDestino('')
                }}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  transferirParaSetor
                    ? 'border-gray-900 bg-gray-50 text-gray-900'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <Building2 className="w-5 h-5 mx-auto mb-2" />
                <div className="font-medium">Setor</div>
              </button>
              <button
                onClick={() => {
                  setTransferirParaSetor(false)
                  setSetorDestino('')
                }}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  !transferirParaSetor
                    ? 'border-gray-900 bg-gray-50 text-gray-900'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <Users className="w-5 h-5 mx-auto mb-2" />
                <div className="font-medium">Atendente</div>
              </button>
            </div>
          </div>

          {/* Setor Destino */}
          {transferirParaSetor && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Setor de Destino *
              </label>
              <select
                value={setorDestino}
                onChange={(e) => setSetorDestino(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent !bg-white !text-black"
                disabled={loading}
              >
                <option value="">Selecione um setor</option>
                {setores
                  .filter((setor) => setor !== setorAtual)
                  .map((setor) => (
                    <option key={setor} value={setor}>
                      {setor}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Atendente Destino */}
          {!transferirParaSetor && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Primeiro, selecione o setor:
              </label>
              <select
                value={setorDestino}
                onChange={(e) => setSetorDestino(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent !bg-white !text-black mb-3"
                disabled={loading}
              >
                <option value="">Selecione um setor</option>
                {setores.map((setor) => (
                  <option key={setor} value={setor}>
                    {setor}
                  </option>
                ))}
              </select>

              {setorDestino && (
                <>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Atendente de Destino *
                  </label>
                  {loadingAtendentes ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                    </div>
                  ) : atendentes.length === 0 ? (
                    <div className="text-sm text-gray-500 py-4 text-center">
                      Nenhum atendente online disponível neste setor
                    </div>
                  ) : (
                    <select
                      value={atendenteDestino}
                      onChange={(e) => setAtendenteDestino(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent !bg-white !text-black"
                      disabled={loading}
                    >
                      <option value="">Selecione um atendente</option>
                      {atendentes.map((atendente) => (
                        <option key={atendente.id} value={atendente.id}>
                          {atendente.nome} ({atendente.carga_trabalho_atual}/{atendente.carga_trabalho_maxima})
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
          )}

          {/* Motivo (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Motivo da Transferência (opcional)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da transferência..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent resize-none !bg-white !text-black"
              disabled={loading}
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleTransferir}
            disabled={loading || (transferirParaSetor && !setorDestino) || (!transferirParaSetor && !atendenteDestino)}
            className="!bg-gray-900 hover:!bg-gray-800 disabled:!bg-gray-300"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Transferindo...</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>Transferir</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

