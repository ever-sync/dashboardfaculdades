'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { FileText, Plus, Edit2, Trash2, Loader2, Clock } from 'lucide-react'
// Função auxiliar para formatar tempo relativo em português (sem date-fns)

interface Anotacao {
  id: string
  autor: string
  autor_id?: string
  texto: string
  timestamp: string
  editado_em?: string
}

interface AnotacoesPanelProps {
  conversaId: string
  faculdadeId: string
  usuarioAtual?: {
    id: string
    nome: string
  }
}

// Função auxiliar para formatar tempo relativo
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

export function AnotacoesPanel({
  conversaId,
  faculdadeId,
  usuarioAtual,
}: AnotacoesPanelProps) {
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [textoAnotacao, setTextoAnotacao] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregarAnotacoes = useCallback(async () => {
    if (!conversaId || !faculdadeId) {
      return
    }

    try {
      setLoading(true)
      setErro(null)
      
      const response = await fetch(`/api/conversas/anotacoes?conversa_id=${conversaId}`)
      const data = await response.json()

      if (!response.ok) {
        // Se a conversa não existe, apenas retornar array vazio (não é um erro crítico)
        if (response.status === 404) {
          setAnotacoes([])
          return
        }
        throw new Error(data.error || 'Erro ao carregar anotações')
      }

      setAnotacoes(data.anotacoes || [])
    } catch (error: any) {
      console.error('Erro ao carregar anotações:', error)
      // Apenas mostrar erro se não for "conversa não encontrada" (que é esperado quando não há conversa ainda)
      if (!error.message?.includes('não encontrada') && !error.message?.includes('not found')) {
        setErro(error.message || 'Erro ao carregar anotações')
      } else {
        setAnotacoes([])
      }
    } finally {
      setLoading(false)
    }
  }, [conversaId, faculdadeId])

  useEffect(() => {
    if (conversaId && faculdadeId) {
      carregarAnotacoes()
    } else {
      // Limpar anotações quando não há conversa selecionada
      setAnotacoes([])
      setErro(null)
    }
  }, [conversaId, faculdadeId, carregarAnotacoes])

  const handleSalvarAnotacao = async () => {
    if (!textoAnotacao.trim()) {
      setErro('Digite uma anotação')
      return
    }

    setLoading(true)
    setErro(null)

    try {
      const response = await fetch('/api/conversas/anotacoes', {
        method: editandoId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversa_id: conversaId,
          texto: textoAnotacao.trim(),
          anotacao_id: editandoId || undefined,
          autor: usuarioAtual?.nome || 'Atendente',
          autor_id: usuarioAtual?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar anotação')
      }

      await carregarAnotacoes()
      setTextoAnotacao('')
      setEditandoId(null)
      setMostrarFormulario(false)
    } catch (error: any) {
      console.error('Erro ao salvar anotação:', error)
      setErro(error.message || 'Erro ao salvar anotação')
    } finally {
      setLoading(false)
    }
  }

  const handleEditarAnotacao = (anotacao: Anotacao) => {
    setTextoAnotacao(anotacao.texto)
    setEditandoId(anotacao.id)
    setMostrarFormulario(true)
    setErro(null)
  }

  const handleExcluirAnotacao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return

    setLoading(true)
    setErro(null)

    try {
      const response = await fetch('/api/conversas/anotacoes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversa_id: conversaId,
          anotacao_id: id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir anotação')
      }

      await carregarAnotacoes()
    } catch (error: any) {
      console.error('Erro ao excluir anotação:', error)
      setErro(error.message || 'Erro ao excluir anotação')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelar = () => {
    setTextoAnotacao('')
    setEditandoId(null)
    setMostrarFormulario(false)
    setErro(null)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Anotações Internas</h3>
        </div>
        {!mostrarFormulario && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMostrarFormulario(true)}
            className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
            <span>Nova Anotação</span>
          </Button>
        )}
      </div>

      {/* Formulário */}
      {mostrarFormulario && (
        <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <textarea
            value={textoAnotacao}
            onChange={(e) => setTextoAnotacao(e.target.value)}
            placeholder="Digite sua anotação interna..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent resize-none !bg-white !text-black mb-2"
            disabled={loading}
          />
          {erro && (
            <div className="mb-2 text-sm text-red-600">{erro}</div>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSalvarAnotacao}
              disabled={loading || !textoAnotacao.trim()}
              className="!bg-gray-900 hover:!bg-gray-800"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>{editandoId ? 'Atualizar' : 'Salvar'}</span>
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancelar}
              disabled={loading}
              className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de Anotações */}
      {loading && anotacoes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Loader2 className="w-12 h-12 mx-auto mb-2 text-gray-400 animate-spin" />
          <p className="text-sm">Carregando anotações...</p>
        </div>
      ) : anotacoes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Nenhuma anotação ainda</p>
          <p className="text-xs text-gray-400 mt-1">
            Adicione anotações internas sobre esta conversa
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {anotacoes
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((anotacao) => (
              <div
                key={anotacao.id}
                className="p-3 border border-gray-200 rounded-lg bg-white"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {anotacao.texto}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {usuarioAtual?.id === anotacao.autor_id && (
                      <>
                        <button
                          onClick={() => handleEditarAnotacao(anotacao)}
                          disabled={loading}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleExcluirAnotacao(anotacao.id)}
                          disabled={loading}
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{anotacao.autor}</span>
                    {anotacao.editado_em && (
                      <span className="text-gray-400">(editada)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(new Date(anotacao.timestamp))}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </Card>
  )
}

