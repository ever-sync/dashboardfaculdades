'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { useToast } from '@/contexts/ToastContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'

function CriarTarefaContent() {
  const { faculdadeSelecionada } = useFaculdade()
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const negociacaoId = searchParams.get('negociacao')

  const [loading, setLoading] = useState(false)
  const [negociacoes, setNegociacoes] = useState<any[]>([])
  const [contatos, setContatos] = useState<any[]>([])
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    negociacao_id: negociacaoId || '',
    contato_id: '',
    responsavel: '',
    status: 'pendente' as const,
    prioridade: 'media' as const,
    prazo: ''
  })

  useEffect(() => {
    if (faculdadeSelecionada) {
      fetchNegociacoes()
      fetchContatos()
    }
  }, [faculdadeSelecionada])

  const fetchNegociacoes = async () => {
    if (!faculdadeSelecionada) return

    const { data } = await supabase
      .from('negociacoes')
      .select('id, nome')
      .eq('faculdade_id', faculdadeSelecionada.id)
      .order('created_at', { ascending: false })

    setNegociacoes(data || [])
  }

  const fetchContatos = async () => {
    if (!faculdadeSelecionada) return

    const { data } = await supabase
      .from('contatos')
      .select('id, nome')
      .eq('faculdade_id', faculdadeSelecionada.id)
      .order('nome')

    setContatos(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!faculdadeSelecionada || !formData.titulo.trim()) {
      showToast('Título é obrigatório', 'warning')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase
        .from('tarefas')
        .insert({
          faculdade_id: faculdadeSelecionada.id,
          titulo: formData.titulo,
          descricao: formData.descricao || null,
          negociacao_id: formData.negociacao_id || null,
          contato_id: formData.contato_id || null,
          responsavel: formData.responsavel || null,
          status: formData.status,
          prioridade: formData.prioridade,
          prazo: formData.prazo ? new Date(formData.prazo).toISOString() : null
        })

      if (error) throw error

      showToast('Tarefa criada com sucesso!', 'success')
      if (formData.negociacao_id) {
        router.push(`/dashboard/crm/${formData.negociacao_id}`)
      } else {
        router.push('/dashboard/crm')
      }
    } catch (error: any) {
      console.error('Erro ao criar tarefa:', error)
      showToast('Erro ao criar tarefa: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse" />}>
        <Header
          title="Criar Tarefa"
          subtitle="Adicione uma nova tarefa ao CRM"
        />
      </Suspense>

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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                      required
                      className="!bg-white !text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-black resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Vinculações */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Vinculações</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Negociação</label>
                    <select
                      value={formData.negociacao_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, negociacao_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                    >
                      <option value="">Selecione uma negociação</option>
                      {negociacoes.map(negociacao => (
                        <option key={negociacao.id} value={negociacao.id}>{negociacao.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
                    <select
                      value={formData.contato_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, contato_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                    >
                      <option value="">Selecione um contato</option>
                      {contatos.map(contato => (
                        <option key={contato.id} value={contato.id}>{contato.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status e Prioridade */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Status e Prioridade</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluida">Concluída</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                    <select
                      value={formData.prioridade}
                      onChange={(e) => setFormData(prev => ({ ...prev, prioridade: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                    <Input
                      type="datetime-local"
                      value={formData.prazo}
                      onChange={(e) => setFormData(prev => ({ ...prev, prazo: e.target.value }))}
                      className="!bg-white !text-black"
                    />
                  </div>
                </div>
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
                  {loading ? 'Salvando...' : 'Salvar Tarefa'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function CriarTarefaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-gray-100 animate-pulse" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
        </div>
      </div>
    }>
      <CriarTarefaContent />
    </Suspense>
  )
}
