'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'

export default function CriarEmpresaPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    observacoes: '',
    tags: [] as string[]
  })
  const [novaTag, setNovaTag] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!faculdadeSelecionada || !formData.nome.trim()) {
      alert('Nome é obrigatório')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase
        .from('empresas')
        .insert({
          faculdade_id: faculdadeSelecionada.id,
          nome: formData.nome,
          cnpj: formData.cnpj || null,
          telefone: formData.telefone || null,
          email: formData.email || null,
          endereco: formData.endereco || null,
          cidade: formData.cidade || null,
          estado: formData.estado || null,
          observacoes: formData.observacoes || null,
          tags: formData.tags.length > 0 ? formData.tags : null
        })

      if (error) throw error

      alert('Empresa criada com sucesso!')
      router.push('/dashboard/crm')
    } catch (error: any) {
      console.error('Erro ao criar empresa:', error)
      alert('Erro ao criar empresa: ' + error.message)
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

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse" />}>
        <Header
          title="Criar Empresa"
          subtitle="Adicione uma nova empresa ao CRM"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome <span className="text-red-500">*</span>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                    <Input
                      type="text"
                      value={formData.cnpj}
                      onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <Input
                      type="text"
                      value={formData.endereco}
                      onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                      className="!bg-white !text-black"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                      <Input
                        type="text"
                        value={formData.cidade}
                        onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                        className="!bg-white !text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <Input
                        type="text"
                        maxLength={2}
                        value={formData.estado}
                        onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value.toUpperCase() }))}
                        className="!bg-white !text-black"
                      />
                    </div>
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
                    <Badge key={idx} variant="info" className="flex items-center gap-1">
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
                  {loading ? 'Salvando...' : 'Salvar Empresa'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  )
}


