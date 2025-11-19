'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'

export default function CriarNegociacaoPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [funis, setFunis] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    funil_id: '',
    etapa: 'lead',
    status: 'nova' as const,
    qualificacao: 0,
    valor: 0,
    responsavel: '',
    tags: [] as string[],
    observacoes: ''
  })
  const [novaTag, setNovaTag] = useState('')

  useEffect(() => {
    if (faculdadeSelecionada) {
      fetchFunis()
    }
  }, [faculdadeSelecionada])

  const fetchFunis = async () => {
    if (!faculdadeSelecionada) return

    try {
      const { data } = await supabase
        .from('funis_vendas')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .eq('ativo', true)
        .order('created_at', { ascending: false })

      if (data) {
        setFunis(data)
        if (data.length > 0 && !formData.funil_id) {
          setFormData(prev => ({ ...prev, funil_id: data[0].id }))
          // Definir primeira etapa do funil
          if (data[0].etapas && Array.isArray(data[0].etapas) && data[0].etapas.length > 0) {
            setFormData(prev => ({ ...prev, etapa: data[0].etapas[0].id || 'lead' }))
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar funis:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!faculdadeSelecionada || !formData.nome.trim()) {
      alert('Nome é obrigatório')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase
        .from('negociacoes')
        .insert({
          faculdade_id: faculdadeSelecionada.id,
          nome: formData.nome,
          telefone: formData.telefone || null,
          email: formData.email || null,
          funil_id: formData.funil_id || null,
          etapa: formData.etapa,
          status: formData.status,
          qualificacao: formData.qualificacao,
          valor: formData.valor,
          responsavel: formData.responsavel || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          observacoes: formData.observacoes || null,
          data_entrada_etapa: new Date().toISOString(),
          dias_na_etapa: 0
        })

      if (error) throw error

      alert('Negociação criada com sucesso!')
      router.push('/dashboard/crm')
    } catch (error: any) {
      console.error('Erro ao criar negociação:', error)
      alert('Erro ao criar negociação: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const adicionarTag = () => {
    if (novaTag.trim() && !formData.tags.includes(novaTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, novaTag.trim()] }))
      setNovaTag('')
    }
  }

  const removerTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const funilSelecionado = funis.find(f => f.id === formData.funil_id)
  const etapasDisponiveis = funilSelecionado?.etapas || []

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header
        title="Criar Negociação"
        subtitle="Adicione uma nova negociação ao CRM"
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 !bg-gray-100 hover:!bg-gray-200 !text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Card className="bg-white border border-gray-200 shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome * <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      required
                      className="!bg-white !text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <Input
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                      className="!bg-white !text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="!bg-white !text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                    <Input
                      type="text"
                      value={formData.responsavel}
                      onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                      className="!bg-white !text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Funil e Etapa */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Funil e Etapa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Funil</label>
                    <select
                      value={formData.funil_id}
                      onChange={(e) => {
                        const funilId = e.target.value
                        setFormData(prev => ({ ...prev, funil_id: funilId }))
                        const funil = funis.find(f => f.id === funilId)
                        if (funil?.etapas && Array.isArray(funil.etapas) && funil.etapas.length > 0) {
                          setFormData(prev => ({ ...prev, etapa: funil.etapas[0].id || 'lead' }))
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                    >
                      <option value="">Selecione um funil</option>
                      {funis.map(funil => (
                        <option key={funil.id} value={funil.id}>{funil.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
                    <select
                      value={formData.etapa}
                      onChange={(e) => setFormData(prev => ({ ...prev, etapa: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                    >
                      {etapasDisponiveis.map((etapa: any) => (
                        <option key={etapa.id} value={etapa.id}>{etapa.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status e Qualificação */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Status e Qualificação</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                    >
                      <option value="nova">Nova</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="negociacao">Negociação</option>
                      <option value="venda">Venda</option>
                      <option value="perdida">Perdida</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qualificação (0-5)</label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      value={formData.qualificacao}
                      onChange={(e) => setFormData(prev => ({ ...prev, qualificacao: parseInt(e.target.value) || 0 }))}
                      className="!bg-white !text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                      className="!bg-white !text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    value={novaTag}
                    onChange={(e) => setNovaTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        adicionarTag()
                      }
                    }}
                    placeholder="Adicionar tag"
                    className="flex-1 !bg-white !text-black"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={adicionarTag}
                    className="!bg-gray-100 hover:!bg-gray-200"
                  >
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                    <Badge key={idx} variant="default" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removerTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-black resize-none"
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                  className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="!bg-teal-600 hover:!bg-teal-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Negociação'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  )
}

