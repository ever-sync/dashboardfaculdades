'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { useToast } from '@/contexts/ToastContext'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Settings,
  Plus,
  MoreVertical,
  ChevronRight,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

interface EtapaFunil {
  id: string
  nome: string
  sigla: string
  destacar_esfriando: boolean
  dias_esfriando?: number
  ordem: number
}

interface FunilVendas {
  id: string
  nome: string
  etapas: EtapaFunil[]
  created_at: string
  updated_at: string
}

export default function ConfigurarFunilPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const { showToast } = useToast()
  const router = useRouter()
  const [funis, setFunis] = useState<FunilVendas[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovoFunil, setShowNovoFunil] = useState(false)
  const [novoFunilNome, setNovoFunilNome] = useState('')
  const [editingEtapa, setEditingEtapa] = useState<string | null>(null)
  const [funilExpandido, setFunilExpandido] = useState<string | null>(null)

  useEffect(() => {
    if (faculdadeSelecionada) {
      fetchFunis()
    }
  }, [faculdadeSelecionada])

  const fetchFunis = async () => {
    if (!faculdadeSelecionada) return

    try {
      setLoading(true)
      // Buscar funis do banco de dados
      const { data, error } = await supabase
        .from('funis_vendas')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .order('created_at', { ascending: false })

      if (error) {
        // Verificar se é um erro de tabela não encontrada (não é crítico)
        const isTableNotFound =
          error.code === 'PGRST116' ||
          error.code === '42P01' ||
          error.message?.includes('does not exist') ||
          error.message?.includes('relation') ||
          error.message?.includes('table')

        if (!isTableNotFound) {
          // Só logar erros reais, não erros de tabela não encontrada
          const errorMessage = error.message || 'Erro desconhecido'
          const errorCode = error.code || 'N/A'
          console.error('Erro ao buscar funis:', {
            message: errorMessage,
            code: errorCode,
            details: error.details || 'Sem detalhes',
            hint: error.hint || 'Sem hint'
          })
        }

        // Usar dados mock em caso de erro
        setFunis(getMockFunis())
      } else if (data && data.length > 0) {
        // Transformar dados do banco
        setFunis(data.map((f: any) => ({
          id: f.id,
          nome: f.nome,
          etapas: f.etapas || [],
          created_at: f.created_at,
          updated_at: f.updated_at
        })))
      } else {
        setFunis(getMockFunis())
      }
    } catch (error: any) {
      // Tratar erros inesperados
      const errorMessage = error?.message || 'Erro desconhecido ao buscar funis'
      const errorCode = error?.code || 'N/A'

      // Verificar se é um erro de tabela não encontrada
      const isTableNotFound =
        errorCode === 'PGRST116' ||
        errorCode === '42P01' ||
        errorMessage?.includes('does not exist') ||
        errorMessage?.includes('relation') ||
        errorMessage?.includes('table')

      if (!isTableNotFound) {
        console.error('Erro ao buscar funis:', {
          message: errorMessage,
          code: errorCode,
          error: error
        })
      }

      setFunis(getMockFunis())
    } finally {
      setLoading(false)
    }
  }

  const getMockFunis = (): FunilVendas[] => [
    {
      id: '1',
      nome: 'APOSENTADORIA',
      etapas: [
        { id: '1-1', nome: 'LEAD', sigla: 'L', destacar_esfriando: false, ordem: 1 },
        { id: '1-2', nome: '1 CONTATO', sigla: '1C', destacar_esfriando: false, ordem: 2 },
        { id: '1-3', nome: '2 CONTATO', sigla: '2C', destacar_esfriando: false, ordem: 3 },
        { id: '1-4', nome: 'RETORNAR NA IDADE DE APOSENTAR', sigla: 'RNIDA', destacar_esfriando: false, ordem: 4 },
        { id: '1-5', nome: 'NEGOCIAÇÃO', sigla: 'N', destacar_esfriando: false, ordem: 5 },
        { id: '1-6', nome: 'ENVIO DE DOCS', sigla: 'EDD', destacar_esfriando: false, ordem: 6 },
        { id: '1-7', nome: 'PRE VENDA', sigla: 'PV', destacar_esfriando: false, ordem: 7 },
        { id: '1-8', nome: 'VENDA', sigla: 'V', destacar_esfriando: false, ordem: 8 },
        { id: '1-9', nome: 'PERDIDO', sigla: 'P', destacar_esfriando: false, ordem: 9 },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      nome: 'RAFA IR',
      etapas: [
        { id: '2-1', nome: 'LEADS', sigla: 'L', destacar_esfriando: false, ordem: 1 },
        { id: '2-2', nome: '1 CONTATO', sigla: '1C', destacar_esfriando: false, ordem: 2 },
        { id: '2-3', nome: '2 CONTATO', sigla: '2C', destacar_esfriando: false, ordem: 3 },
        { id: '2-4', nome: '3 CONTATO', sigla: '3C', destacar_esfriando: false, ordem: 4 },
        { id: '2-5', nome: 'RESPONDEU', sigla: 'R', destacar_esfriando: false, ordem: 5 },
        { id: '2-6', nome: 'NEGOCIAÇÃO', sigla: 'N', destacar_esfriando: false, ordem: 6 },
        { id: '2-7', nome: 'PRE-VENDA', sigla: 'P', destacar_esfriando: false, ordem: 7 },
        { id: '2-8', nome: 'PREVIDAS', sigla: 'P', destacar_esfriando: false, ordem: 8 },
        { id: '2-9', nome: 'VENDA', sigla: 'V', destacar_esfriando: false, ordem: 9 },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  const handleToggleEsfriando = async (funilId: string, etapaId: string) => {
    setFunis(prev => prev.map(funil => {
      if (funil.id === funilId) {
        return {
          ...funil,
          etapas: funil.etapas.map(etapa =>
            etapa.id === etapaId
              ? { ...etapa, destacar_esfriando: !etapa.destacar_esfriando }
              : etapa
          )
        }
      }
      return funil
    }))

    // Salvar no banco após atualizar estado
    setTimeout(() => {
      saveFunil(funilId)
    }, 100)
  }

  const handleConfigurarEtapa = (etapaId: string) => {
    setEditingEtapa(etapaId)
    // TODO: Abrir modal de configuração da etapa
  }

  const handleCriarFunil = async () => {
    if (!novoFunilNome.trim() || !faculdadeSelecionada) return

    try {
      const novaEtapa = {
        id: `etapa-${Date.now()}`,
        nome: 'LEAD',
        sigla: 'L',
        destacar_esfriando: false,
        dias_esfriando: undefined,
        ordem: 1
      }

      // Salvar no banco primeiro
      const { data, error } = await supabase
        .from('funis_vendas')
        .insert({
          nome: novoFunilNome,
          faculdade_id: faculdadeSelecionada.id,
          etapas: [novaEtapa],
          ativo: true
        })
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          // Tabela não existe, usar dados mock
          const novoFunil: FunilVendas = {
            id: Date.now().toString(),
            nome: novoFunilNome,
            etapas: [novaEtapa],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          setFunis([...funis, novoFunil])
        } else {
          throw error
        }
      } else if (data) {
        // Usar dados retornados do banco
        const novoFunil: FunilVendas = {
          id: data.id,
          nome: data.nome,
          etapas: data.etapas || [novaEtapa],
          created_at: data.created_at,
          updated_at: data.updated_at
        }
        setFunis([...funis, novoFunil])
        setFunilExpandido(data.id)
      }

      setNovoFunilNome('')
      setShowNovoFunil(false)
    } catch (error) {
      console.error('Erro ao criar funil:', error)
      showToast('Erro ao criar funil. Verifique se a tabela existe no banco de dados.', 'error')
    }
  }

  const saveFunil = async (funilId: string) => {
    if (!faculdadeSelecionada) return

    const funil = funis.find(f => f.id === funilId)
    if (!funil) return

    try {
      const { error } = await supabase
        .from('funis_vendas')
        .update({
          nome: funil.nome,
          etapas: funil.etapas,
          updated_at: new Date().toISOString(),
        })
        .eq('id', funilId)
        .eq('faculdade_id', faculdadeSelecionada.id)

      if (error) {
        if (error.code !== 'PGRST116' && !error.message?.includes('does not exist')) {
          console.error('Erro ao salvar funil:', error)
          showToast('Erro ao salvar funil: ' + error.message, 'error')
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar funil:', error)
      if (error.message && !error.message.includes('does not exist')) {
        alert('Erro ao salvar funil: ' + error.message)
      }
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse" />}>
        <Header
          title="Funis de vendas"
          subtitle="Configurações"
        />
      </Suspense>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Botão Voltar */}
          <div className="mb-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.back()}
              className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <button className="px-4 py-2 border-b-2 border-teal-600 text-teal-600 font-medium">
                FUNIL DE VENDAS
              </button>
            </div>
          </div>

          {/* Botões dos Funis */}
          <div className="mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              {funis.map((funil) => (
                <button
                  key={funil.id}
                  onClick={() => setFunilExpandido(funilExpandido === funil.id ? null : funil.id)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${funilExpandido === funil.id
                      ? 'border-teal-600 bg-teal-50 text-teal-700 font-semibold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {funil.nome}
                </button>
              ))}

              {/* Botão Criar Funil */}
              {!showNovoFunil ? (
                <button
                  onClick={() => setShowNovoFunil(true)}
                  className="px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 bg-white text-gray-600 hover:border-teal-600 hover:text-teal-600 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Funil de Vendas
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Nome do funil"
                    value={novoFunilNome}
                    onChange={(e) => setNovoFunilNome(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCriarFunil()
                      } else if (e.key === 'Escape') {
                        setShowNovoFunil(false)
                        setNovoFunilNome('')
                      }
                    }}
                    className="w-48 !bg-white !text-black"
                    autoFocus
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCriarFunil}
                    className="!bg-teal-600 hover:!bg-teal-700"
                  >
                    Criar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowNovoFunil(false)
                      setNovoFunilNome('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Conteúdo do Funil Expandido */}
          {funilExpandido && funis.find(f => f.id === funilExpandido) && (
            <Card className="bg-white border border-gray-200 shadow-sm">
              <div className="p-6">
                {(() => {
                  const funil = funis.find(f => f.id === funilExpandido)!
                  return (
                    <>
                      {/* Cabeçalho do Funil */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-semibold text-gray-900">{funil.nome}</h2>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="!bg-blue-50 hover:!bg-blue-100 !text-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Automação entre funis
                        </Button>
                      </div>

                      {/* Visualização do Funil - Linha de Etapas */}
                      <div className="mb-6 overflow-x-auto pb-4">
                        <div className="flex items-center gap-2 min-w-max">
                          {funil.etapas.map((etapa, index) => (
                            <div key={etapa.id} className="flex items-center">
                              <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-teal-100 border-2 border-teal-600 flex items-center justify-center text-teal-700 font-semibold text-sm">
                                  {etapa.sigla}
                                </div>
                                <span className="mt-2 text-xs text-gray-600 text-center max-w-[80px] truncate">
                                  {etapa.nome}
                                </span>
                              </div>
                              {index < funil.etapas.length - 1 && (
                                <div className="w-8 h-0.5 bg-teal-600 mx-2"></div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Etapas do Funil - Lista de Configuração */}
                      <div className="space-y-4">
                        {funil.etapas.map((etapa, index) => (
                          <div
                            key={etapa.id}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-gray-900">{etapa.nome}</h3>
                                  <Badge variant="info" className="text-xs">
                                    Sigla: {etapa.sigla}
                                  </Badge>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600">
                                      Destacar negociações esfriando na etapa
                                    </span>
                                    <button
                                      onClick={() => handleToggleEsfriando(funil.id, etapa.id)}
                                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                                      style={{
                                        backgroundColor: etapa.destacar_esfriando ? '#14B8A6' : '#D1D5DB'
                                      }}
                                    >
                                      <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${etapa.destacar_esfriando ? 'translate-x-6' : 'translate-x-1'
                                          }`}
                                      />
                                    </button>
                                    {etapa.destacar_esfriando && (
                                      <Input
                                        type="number"
                                        placeholder="dias"
                                        value={etapa.dias_esfriando || ''}
                                        onChange={(e) => {
                                          const valor = Number(e.target.value)
                                          setFunis(prev => prev.map(f => {
                                            if (f.id === funil.id) {
                                              return {
                                                ...f,
                                                etapas: f.etapas.map(et =>
                                                  et.id === etapa.id
                                                    ? { ...et, dias_esfriando: valor }
                                                    : et
                                                )
                                              }
                                            }
                                            return f
                                          }))
                                          // Salvar no banco após atualizar
                                          setTimeout(() => {
                                            saveFunil(funil.id)
                                          }, 500)
                                        }}
                                        className="w-20 !bg-white !text-black text-sm"
                                      />
                                    )}
                                  </div>

                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleConfigurarEtapa(etapa.id)}
                                    className="!bg-blue-50 hover:!bg-blue-100 !text-blue-700"
                                  >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Configurar etapa
                                  </Button>
                                </div>

                                <div className="mt-2 text-xs text-gray-500">
                                  ID: {etapa.id}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </div>
            </Card>
          )}

          {/* Mensagem quando nenhum funil está expandido */}
          {!funilExpandido && funis.length > 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">Selecione um funil para configurar</p>
              <p className="text-sm">Clique em um dos funis acima para ver e editar suas etapas</p>
            </div>
          )}

          {/* Mensagem quando não há funis */}
          {funis.length === 0 && !showNovoFunil && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">Nenhum funil criado</p>
              <p className="text-sm">Clique em "Adicionar Funil de Vendas" para criar o primeiro</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


