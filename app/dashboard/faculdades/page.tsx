'use client'

import { useState, useEffect, Suspense } from 'react'
import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Building2, Edit, Trash2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { FaculdadeModal } from '@/components/dashboard/FaculdadeModal'
import { toast } from 'react-hot-toast'
import { Faculdade } from '@/types/supabase'

export default function FaculdadesPage() {
  const [faculdades, setFaculdades] = useState<Faculdade[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [faculdadeEditando, setFaculdadeEditando] = useState<Faculdade | null>(null)
  const [deletandoId, setDeletandoId] = useState<string | null>(null)

  const carregar = async () => {
    const { data, error } = await supabase
      .from('faculdades')
      .select('*')
      .order('nome')

    if (error) {
      toast.error('Erro ao carregar faculdades')
      return
    }

    setFaculdades(data || [])
  }

  useEffect(() => {
    carregar()
  }, [])

  const handleNovo = () => {
    setFaculdadeEditando(null)
    setIsModalOpen(true)
  }

  const handleEditar = (faculdade: Faculdade) => {
    setFaculdadeEditando(faculdade)
    setIsModalOpen(true)
  }

  const handleDeletar = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta faculdade?')) return

    setDeletandoId(id)
    const { error } = await supabase
      .from('faculdades')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erro ao excluir faculdade')
    } else {
      toast.success('Faculdade excluída com sucesso')
      carregar()
    }
    setDeletandoId(null)
  }

  const getPlanoBadge = (plano: string) => {
    switch (plano?.toLowerCase()) {
      case 'enterprise': return 'info'
      case 'pro': return 'info'
      default: return 'secondary'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ativo': return 'success'
      case 'inativo': return 'danger'
      default: return 'warning'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse" />}>
        <Header
          title="Faculdades"
          subtitle="Gerencie as faculdades cadastradas"
        />
      </Suspense>

      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Faculdades</h2>
          <Button onClick={handleNovo}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Faculdade
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faculdades.map((f) => (
            <Card key={f.id} className="bg-white border border-gray-200 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{f.nome}</h3>
                      <p className="text-sm text-gray-500">{f.cnpj}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Plano</span>
                    <Badge variant={getPlanoBadge(f.plano)}>{f.plano}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <Badge variant={getStatusBadge(f.status)}>{f.status}</Badge>
                  </div>
                  {f.telefone && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Telefone</span>
                      <span className="text-gray-900">{f.telefone}</span>
                    </div>
                  )}
                  {f.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Email</span>
                      <span className="text-gray-900 truncate ml-2">{f.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditar(f)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeletar(f.id)}
                    disabled={deletandoId === f.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {faculdades.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma faculdade cadastrada</h3>
              <p className="text-gray-600 mb-6">Adicione sua primeira faculdade cliente</p>
              <Button onClick={handleNovo}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Faculdade
              </Button>
            </div>
          </Card>
        )}
      </div>

      <FaculdadeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setFaculdadeEditando(null)
        }}
        onSave={carregar}
        faculdade={faculdadeEditando}
      />
    </div>
  )
}