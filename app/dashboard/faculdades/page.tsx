'use client'

import { useEffect, useState } from 'react'
import { Faculdade } from '@/types/supabase'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Building2, Plus, Edit, Trash2 } from 'lucide-react'
import { Header } from '@/components/dashboard/Header'
import { FaculdadeModal } from '@/components/dashboard/FaculdadeModal'

export default function FaculdadesPage() {
  const [faculdades, setFaculdades] = useState<Faculdade[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [faculdadeEditando, setFaculdadeEditando] = useState<Faculdade | null>(null)
  const [deletandoId, setDeletandoId] = useState<string | null>(null)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    try {
      setLoading(true)
      const res = await fetch('/api/faculdades')
      const data = await res.json()
      setFaculdades(data || [])
    } catch (error) {
      console.error('Erro ao carregar faculdades:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNovo = () => {
    setFaculdadeEditando(null)
    setIsModalOpen(true)
  }

  const handleEditar = (faculdade: Faculdade) => {
    setFaculdadeEditando(faculdade)
    setIsModalOpen(true)
  }

  const handleDeletar = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta faculdade?')) {
      return
    }

    try {
      setDeletandoId(id)
      const res = await fetch(`/api/faculdades/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Erro ao deletar faculdade')
        return
      }

      await carregar()
    } catch (error) {
      console.error('Erro ao deletar faculdade:', error)
      alert('Erro ao deletar faculdade')
    } finally {
      setDeletandoId(null)
    }
  }

  const getPlanoBadge = (plano: string) => {
    const variants: Record<string, 'success' | 'warning' | 'info'> = {
      basico: 'info',
      pro: 'warning',
      enterprise: 'success'
    }
    return variants[plano] || 'info'
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      ativo: 'success',
      inativo: 'warning',
      suspenso: 'danger'
    }
    return variants[status] || 'info'
  }

  if (loading) {
    return (
      <div>
        <Header title="Faculdades" subtitle="Gerencie seus clientes" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Faculdades" subtitle="Gerencie seus clientes" />
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div></div>
          <Button onClick={handleNovo}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Faculdade
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faculdades.map((f) => (
            <Card key={f.id}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
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