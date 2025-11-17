'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { BookOpen, Search, Loader2, Copy, CheckCircle2 } from 'lucide-react'

interface SugestaoBase {
  id: string
  pergunta: string
  resposta: string
  categoria?: string
  tags?: string[]
  visualizacoes?: number
  util?: number
}

interface SugestoesBaseProps {
  query: string
  faculdadeId: string
  onSelecionarSugestao: (resposta: string) => void
  autoBuscar?: boolean
  limite?: number
}

export function SugestoesBase({
  query,
  faculdadeId,
  onSelecionarSugestao,
  autoBuscar = false,
  limite = 5,
}: SugestoesBaseProps) {
  const [sugestoes, setSugestoes] = useState<SugestaoBase[]>([])
  const [loading, setLoading] = useState(false)
  const [mostrarBuscar, setMostrarBuscar] = useState(true) // Sempre mostrar campo de busca quando usado em dropdown
  const [queryBusca, setQueryBusca] = useState(query)
  const [copiadoId, setCopiadoId] = useState<string | null>(null)

  useEffect(() => {
    setQueryBusca(query)
  }, [query])

  useEffect(() => {
    if (autoBuscar && query.trim().length >= 3) {
      buscarSugestoes(query)
    }
  }, [autoBuscar, query, faculdadeId])

  const buscarSugestoes = async (textoBusca: string) => {
    if (!textoBusca.trim() || textoBusca.trim().length < 3) {
      setSugestoes([])
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `/api/base-conhecimento/buscar?query=${encodeURIComponent(textoBusca)}&faculdade_id=${faculdadeId}&limite=${limite}`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar na base de conhecimento')
      }

      setSugestoes(data.resultados || [])
    } catch (error: any) {
      console.error('Erro ao buscar sugestões:', error)
      setSugestoes([])
    } finally {
      setLoading(false)
    }
  }

  const handleBuscar = () => {
    buscarSugestoes(queryBusca)
    setMostrarBuscar(false)
  }

  const handleCopiarResposta = async (resposta: string, id: string) => {
    try {
      await navigator.clipboard.writeText(resposta)
      setCopiadoId(id)
      setTimeout(() => setCopiadoId(null), 2000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  if (sugestoes.length === 0 && !loading && !mostrarBuscar) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900 text-sm">Base de Conhecimento</h3>
      </div>

      {/* Campo de Busca */}
      <div className="mb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={queryBusca}
              onChange={(e) => setQueryBusca(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleBuscar()
                }
              }}
              placeholder="Buscar na base de conhecimento..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent !bg-white !text-black"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBuscar}
              disabled={loading || !queryBusca.trim()}
              className="!bg-blue-600 hover:!bg-blue-700 !text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </>
              )}
            </Button>
          </div>
        </div>

      {/* Lista de Sugestões */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-gray-600">Buscando...</span>
        </div>
      )}

      {!loading && sugestoes.length > 0 && (
        <div className="space-y-3">
          {sugestoes.map((sugestao) => (
            <div
              key={sugestao.id}
              className="p-3 bg-white border border-blue-200 rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-gray-900 mb-1">
                    {sugestao.pergunta}
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                    {sugestao.resposta}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => handleCopiarResposta(sugestao.resposta, sugestao.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copiar resposta"
                  >
                    {copiadoId === sugestao.id ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  {sugestao.categoria && (
                    <Badge variant="info" className="text-xs">
                      {sugestao.categoria}
                    </Badge>
                  )}
                  {sugestao.visualizacoes !== undefined && sugestao.visualizacoes > 0 && (
                    <span className="text-xs text-gray-500">
                      {sugestao.visualizacoes} visualizações
                    </span>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSelecionarSugestao(sugestao.resposta)}
                  className="!bg-blue-600 hover:!bg-blue-700 !text-white"
                >
                  <span>Usar Resposta</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && sugestoes.length === 0 && queryBusca.trim().length >= 3 && !mostrarBuscar && (
        <div className="text-center py-4 text-gray-500 text-sm">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>Nenhuma sugestão encontrada</p>
          <p className="text-xs text-gray-400 mt-1">
            Tente buscar com outras palavras-chave
          </p>
        </div>
      )}
    </div>
  )
}

