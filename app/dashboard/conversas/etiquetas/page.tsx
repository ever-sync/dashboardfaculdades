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
import { useUser } from '@/hooks/useUser'
import { Tag as TagIcon, Search, Edit, Trash2, User, Calendar } from 'lucide-react'

interface Etiqueta {
  id: string
  nome: string
  descricao?: string
  cor: string
  criada_por?: string
  atualizada_por?: string
  clientes_count?: number
  created_at: string
  updated_at: string
}

const coresDisponiveis = [
  '#FBBF24', // yellow-orange
  '#F97316', // orange
  '#EF4444', // red
  '#EC4899', // magenta
  '#A855F7', // purple
  '#10B981', // bright green
  '#14B8A6', // teal
  '#3B82F6', // bright blue
  '#1E40AF', // dark blue
  '#374151', // dark gray
  '#9CA3AF', // light gray
]

export default function EtiquetasPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const { showToast } = useToast()
  const { getUserName } = useUser()
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const [currentPage, setCurrentPage] = useState(1)

  // Form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#3B82F6',
  })

  useEffect(() => {
    if (faculdadeSelecionada) {
      fetchEtiquetas()
    }
  }, [faculdadeSelecionada, currentPage, itemsPerPage])

  const fetchEtiquetas = async () => {
    if (!faculdadeSelecionada) return

    try {
      setLoading(true)
      let query = supabase
        .from('etiquetas')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (searchTerm) {
        query = query.ilike('nome', `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar etiquetas:', error)
        setEtiquetas([])
      } else {
        // Buscar contagem de clientes para cada etiqueta
        // Tags nas conversas podem ser array de strings (nomes) ou IDs
        const etiquetasComContagem = await Promise.all(
          (data || []).map(async (etiqueta) => {
            // Buscar conversas que contêm esta etiqueta (por nome ou ID)
            const { count } = await supabase
              .from('conversas_whatsapp')
              .select('*', { count: 'exact', head: true })
              .eq('faculdade_id', faculdadeSelecionada.id)
              .or(`tags.cs.{${etiqueta.id}},tags.cs.{${etiqueta.nome}}`)

            return {
              ...etiqueta,
              clientes_count: count || 0,
            }
          })
        )
        setEtiquetas(etiquetasComContagem)
      }
    } catch (error) {
      console.error('Erro ao buscar etiquetas:', error)
      setEtiquetas([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!faculdadeSelecionada || !formData.nome.trim()) return

    try {
      if (editingId) {
        // Atualizar
        const { error } = await supabase
          .from('etiquetas')
          .update({
            nome: formData.nome,
            descricao: formData.descricao || null,
            cor: formData.cor,
            updated_at: new Date().toISOString(),
            atualizada_por: getUserName(),
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        // Criar
        const { error } = await supabase
          .from('etiquetas')
          .insert({
            nome: formData.nome,
            descricao: formData.descricao || null,
            cor: formData.cor,
            faculdade_id: faculdadeSelecionada.id,
            criada_por: getUserName(),
            atualizada_por: getUserName(),
          })

        if (error) throw error
      }

      setShowForm(false)
      setEditingId(null)
      setFormData({ nome: '', descricao: '', cor: '#3B82F6' })
      await fetchEtiquetas()
    } catch (error: any) {
      console.error('Erro ao salvar etiqueta:', error)
      showToast('Erro ao salvar etiqueta: ' + error.message, 'error')
    }
  }

  const handleEdit = (etiqueta: Etiqueta) => {
    setEditingId(etiqueta.id)
    setFormData({
      nome: etiqueta.nome,
      descricao: etiqueta.descricao || '',
      cor: etiqueta.cor,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta etiqueta?')) return

    try {
      const { error } = await supabase
        .from('etiquetas')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchEtiquetas()
    } catch (error: any) {
      console.error('Erro ao excluir etiqueta:', error)
      showToast('Erro ao excluir etiqueta: ' + error.message, 'error')
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return 'N/A'
    }
  }

  const totalPages = Math.ceil(etiquetas.length / itemsPerPage)

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse" />}>
        <Header
          title="Etiquetas"
          subtitle="Gerencie etiquetas de contatos"
        />
      </Suspense>

      <main className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Formulário de Nova Etiqueta */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 border-2 border-blue-500 rounded-lg flex items-center justify-center">
                  <TagIcon className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                {editingId ? 'Editar Etiqueta' : 'Nova Etiqueta'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <Input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome da etiqueta"
                    required
                    className="!bg-white !text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição da etiqueta"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-black resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Selecionar a cor da etiqueta
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {coresDisponiveis.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        onClick={() => setFormData({ ...formData, cor })}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${formData.cor === cor
                          ? 'border-blue-600 scale-110'
                          : 'border-gray-300 hover:border-gray-400'
                          }`}
                        style={{ backgroundColor: cor }}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full !bg-teal-600 hover:!bg-teal-700"
                >
                  {editingId ? 'Atualizar' : 'Cadastrar'}
                </Button>

                {editingId && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditingId(null)
                      setFormData({ nome: '', descricao: '', cor: '#3B82F6' })
                      setShowForm(false)
                    }}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                )}
              </form>
            </div>
          </Card>

          {/* Lista de Etiquetas */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Resultados por página:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 text-sm"
                  >
                    <option value={6}>6</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchEtiquetas()
                      }
                    }}
                    className="pl-10 !bg-white !text-black text-sm w-full sm:w-64"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Criada por</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Atualizada por</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Clientes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Atualização</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Criação</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : etiquetas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <TagIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-600">Nenhuma etiqueta encontrada</p>
                      </td>
                    </tr>
                  ) : (
                    etiquetas.map((etiqueta) => (
                      <tr key={etiqueta.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            style={{
                              backgroundColor: etiqueta.cor,
                              color: '#fff',
                            }}
                            className="text-xs font-medium"
                          >
                            {etiqueta.nome}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {etiqueta.criada_por || 'Admin'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {etiqueta.atualizada_por || 'Admin'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{etiqueta.clientes_count || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(etiqueta.updated_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(etiqueta.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(etiqueta)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(etiqueta.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">
                  {etiquetas.length} Itens encontrados {totalPages} Páginas encontradas
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="!bg-gray-100 hover:!bg-gray-200"
                >
                  K
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="!bg-gray-100 hover:!bg-gray-200"
                >
                  &lt;
                </Button>
                <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-sm font-medium">
                  {currentPage}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= totalPages}
                  className="!bg-gray-100 hover:!bg-gray-200"
                >
                  &gt;
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                  className="!bg-gray-100 hover:!bg-gray-200"
                >
                  D
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

