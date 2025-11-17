'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Lightbulb, Sparkles, Loader2, Copy, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AgenteIA } from '@/types/supabase'
import { Prospect } from '@/types/supabase'

interface ScriptSuggestionsProps {
  ultimaMensagem: string
  faculdadeId: string
  setor?: string
  prospectInfo?: Prospect | null
  onSelecionarScript: (script: string) => void
}

export function ScriptSuggestions({
  ultimaMensagem,
  faculdadeId,
  setor,
  prospectInfo,
  onSelecionarScript,
}: ScriptSuggestionsProps) {
  const [agentesIA, setAgentesIA] = useState<AgenteIA[]>([])
  const [loading, setLoading] = useState(false)
  const [copiadoId, setCopiadoId] = useState<string | null>(null)

  useEffect(() => {
    if (faculdadeId && setor) {
      carregarAgentesPorSetor()
    }
  }, [faculdadeId, setor])

  const carregarAgentesPorSetor = async () => {
    if (!faculdadeId || !setor) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('agentes_ia')
        .select('*')
        .eq('faculdade_id', faculdadeId)
        .eq('setor', setor)
        .eq('ativo', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar agentes IA:', error)
        setAgentesIA([])
      } else {
        setAgentesIA(data || [])
      }
    } catch (error: any) {
      console.error('Erro ao carregar agentes IA:', error)
      setAgentesIA([])
    } finally {
      setLoading(false)
    }
  }

  // Substituir variáveis dinâmicas nos scripts
  const processarScript = (script: string): string => {
    let scriptProcessado = script

    // Variáveis disponíveis
    const variaveis: Record<string, string> = {
      '{{nome}}': prospectInfo?.nome || prospectInfo?.nome_completo || 'Cliente',
      '{{nome_completo}}': prospectInfo?.nome_completo || prospectInfo?.nome || 'Cliente',
      '{{curso}}': prospectInfo?.curso || prospectInfo?.curso_pretendido || 'curso',
      '{{curso_pretendido}}': prospectInfo?.curso_pretendido || prospectInfo?.curso || 'curso',
      '{{valor_mensalidade}}': prospectInfo?.valor_mensalidade
        ? `R$ ${Number(prospectInfo.valor_mensalidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : 'valor',
      '{{telefone}}': prospectInfo?.telefone || 'telefone',
      '{{email}}': prospectInfo?.email || 'email',
      '{{status}}': prospectInfo?.status_academico || 'status',
    }

    // Substituir variáveis
    Object.keys(variaveis).forEach((variavel) => {
      const regex = new RegExp(variavel.replace(/[{}]/g, '\\$&'), 'gi')
      scriptProcessado = scriptProcessado.replace(regex, variaveis[variavel])
    })

    return scriptProcessado
  }

  // Detectar keywords na última mensagem para sugerir scripts relevantes
  const scriptsRelevantes = useMemo(() => {
    if (!ultimaMensagem || ultimaMensagem.trim().length < 3) return []

    const mensagemLower = ultimaMensagem.toLowerCase()
    const keywords: Record<string, string[]> = {
      matricula: ['matricula', 'matricular', 'inscrever', 'inscrição'],
      vestibular: ['vestibular', 'processo seletivo', 'prova', 'entrada'],
      valor: ['valor', 'preço', 'mensalidade', 'parcela', 'pagamento', 'custo'],
      bolsa: ['bolsa', 'desconto', 'financiamento', 'parceria'],
      ead: ['ead', 'online', 'distância', 'remoto'],
      presencial: ['presencial', 'sala de aula', 'campus'],
      duvida: ['dúvida', 'pergunta', 'quero saber', 'como funciona'],
    }

    // Encontrar scripts que contêm keywords relevantes
    return agentesIA
      .map((agente) => {
        const scriptLower = agente.script_atendimento.toLowerCase()
        const descricaoLower = agente.descricao?.toLowerCase() || ''
        const textoCompleto = `${scriptLower} ${descricaoLower}`

        // Calcular relevância
        let relevancia = 0
        Object.entries(keywords).forEach(([categoria, palavras]) => {
          palavras.forEach((palavra) => {
            if (mensagemLower.includes(palavra)) {
              // Verificar se o script também menciona essa categoria
              if (textoCompleto.includes(categoria) || textoCompleto.includes(palavra)) {
                relevancia += 2
              }
            }
          })
        })

        // Verificar correspondência direta
        const palavrasMensagem = mensagemLower.split(/\s+/).filter(p => p.length > 3)
        palavrasMensagem.forEach((palavra) => {
          if (textoCompleto.includes(palavra)) {
            relevancia += 1
          }
        })

        return {
          agente,
          relevancia,
        }
      })
      .filter((item) => item.relevancia > 0)
      .sort((a, b) => b.relevancia - a.relevancia)
      .slice(0, 3)
      .map((item) => item.agente)
  }, [ultimaMensagem, agentesIA])

  const handleCopiarScript = async (script: string, id: string) => {
    try {
      const scriptProcessado = processarScript(script)
      await navigator.clipboard.writeText(scriptProcessado)
      setCopiadoId(id)
      setTimeout(() => setCopiadoId(null), 2000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  if (!setor || agentesIA.length === 0) {
    return null
  }

  if (scriptsRelevantes.length === 0 && !loading) {
    return null
  }

  return (
    <Card className="p-3 bg-purple-50 border-purple-200 mb-2">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <h4 className="font-semibold text-sm text-gray-900">Sugestões de Scripts</h4>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="space-y-2">
          {scriptsRelevantes.map((agente) => {
            const scriptProcessado = processarScript(agente.script_atendimento)

            return (
              <div
                key={agente.id}
                className="p-2 bg-white border border-purple-200 rounded-lg"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <h5 className="font-medium text-xs text-gray-900 mb-1">
                      {agente.nome}
                    </h5>
                    <p className="text-xs text-gray-700 line-clamp-2 whitespace-pre-wrap">
                      {scriptProcessado.substring(0, 150)}
                      {scriptProcessado.length > 150 ? '...' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleCopiarScript(agente.script_atendimento, agente.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Copiar script"
                    >
                      {copiadoId === agente.id ? (
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSelecionarScript(scriptProcessado)}
                  className="w-full mt-2 !bg-purple-600 hover:!bg-purple-700 !text-white text-xs"
                >
                  <Lightbulb className="w-3 h-3" />
                  <span>Usar Script</span>
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

