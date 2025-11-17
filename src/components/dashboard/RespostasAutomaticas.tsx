'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Sparkles, 
  Loader2, 
  Send, 
  X,
  Lightbulb
} from 'lucide-react'
import { 
  detectarRegra, 
  processarRegra, 
  sugerirRespostaAutomatica,
  REGRAS_AUTOMATICAS 
} from '@/lib/regrasAutomaticas'
import { Prospect } from '@/types/supabase'

interface RespostasAutomaticasProps {
  ultimaMensagem: string
  remetente: string
  prospect?: Prospect | null
  faculdadeId?: string
  onSelecionarResposta: (resposta: string) => void
  onDescartar?: () => void
  autoMostrar?: boolean
}

export function RespostasAutomaticas({
  ultimaMensagem,
  remetente,
  prospect,
  faculdadeId,
  onSelecionarResposta,
  onDescartar,
  autoMostrar = true,
}: RespostasAutomaticasProps) {
  const [respostaAutomatica, setRespostaAutomatica] = useState<string | null>(null)
  const [regraDetectada, setRegraDetectada] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    // Só processar se for mensagem do cliente e estiver configurado para mostrar automaticamente
    const remetenteLower = (remetente || '').toLowerCase()
    const isCliente = remetenteLower === 'cliente' || remetenteLower === 'usuario'

    if (!autoMostrar || !isCliente || !ultimaMensagem || ultimaMensagem.trim().length === 0) {
      setRespostaAutomatica(null)
      setRegraDetectada(null)
      setMostrar(false)
      return
    }

    processarRespostaAutomatica()
  }, [ultimaMensagem, remetente, prospect, faculdadeId, autoMostrar])

  const processarRespostaAutomatica = async () => {
    setLoading(true)

    try {
      // Detectar regra aplicável
      const regra = detectarRegra(ultimaMensagem)

      if (!regra) {
        setRespostaAutomatica(null)
        setRegraDetectada(null)
        setMostrar(false)
        return
      }

      setRegraDetectada(regra.id)

      // Processar regra e obter resposta
      const resposta = await sugerirRespostaAutomatica(
        ultimaMensagem,
        prospect || null,
        faculdadeId || undefined
      )

      if (resposta) {
        setRespostaAutomatica(resposta)
        setMostrar(true)
      } else {
        setRespostaAutomatica(null)
        setRegraDetectada(null)
        setMostrar(false)
      }
    } catch (error: any) {
      console.error('Erro ao processar resposta automática:', error)
      setRespostaAutomatica(null)
      setRegraDetectada(null)
      setMostrar(false)
    } finally {
      setLoading(false)
    }
  }

  const handleUsarResposta = () => {
    if (respostaAutomatica) {
      onSelecionarResposta(respostaAutomatica)
      setMostrar(false)
    }
  }

  const handleDescartar = () => {
    setMostrar(false)
    onDescartar?.()
  }

  const regraNome = regraDetectada 
    ? REGRAS_AUTOMATICAS.find(r => r.id === regraDetectada)?.nome 
    : null

  if (!mostrar || !respostaAutomatica || loading) {
    return null
  }

  return (
    <Card className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 mb-2">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h4 className="font-semibold text-sm text-gray-900">Resposta Automática Sugerida</h4>
          {regraNome && (
            <Badge variant="info" className="text-xs">
              {regraNome}
            </Badge>
          )}
        </div>
        <button
          onClick={handleDescartar}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Descartar"
        >
          <X className="w-3 h-3 text-gray-600" />
        </button>
      </div>

      <div className="bg-white rounded-lg p-3 border border-blue-200 mb-3">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {respostaAutomatica}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleUsarResposta}
          className="flex-1 !bg-blue-600 hover:!bg-blue-700 !text-white"
        >
          <Send className="w-4 h-4" />
          <span>Usar Resposta</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            // Copiar para área de transferência (não implementado ainda)
            if (navigator.clipboard) {
              navigator.clipboard.writeText(respostaAutomatica)
            }
          }}
          className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
          title="Copiar resposta"
        >
          <Lightbulb className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}

