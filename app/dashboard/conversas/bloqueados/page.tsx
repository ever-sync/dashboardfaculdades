'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { User, ArrowRight, ArrowLeft, Info, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export default function BloqueadosPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const [clientes, setClientes] = useState<any[]>([])
  const [bloqueados, setBloqueados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchClientes, setSearchClientes] = useState('')
  const [searchBloqueados, setSearchBloqueados] = useState('')
  const [canalClientes, setCanalClientes] = useState('')
  const [canalBloqueados, setCanalBloqueados] = useState('')
  const [pageClientes, setPageClientes] = useState(1)
  const [pageBloqueados, setPageBloqueados] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (faculdadeSelecionada) {
      fetchClientes()
      fetchBloqueados()
    }
  }, [faculdadeSelecionada, pageClientes, pageBloqueados])

  const fetchClientes = async () => {
    if (!faculdadeSelecionada) return

    try {
      setLoading(true)
      let query = supabase
        .from('conversas_whatsapp')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .eq('bloqueado', false)
        .order('nome', { ascending: true })
        .range((pageClientes - 1) * itemsPerPage, pageClientes * itemsPerPage - 1)

      if (searchClientes) {
        query = query.or(`nome.ilike.%${searchClientes}%,telefone.ilike.%${searchClientes}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar clientes:', error)
        setClientes([])
      } else {
        setClientes(data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBloqueados = async () => {
    if (!faculdadeSelecionada) return

    try {
      let query = supabase
        .from('conversas_whatsapp')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .eq('bloqueado', true)
        .order('data_bloqueio', { ascending: false })
        .range((pageBloqueados - 1) * itemsPerPage, pageBloqueados * itemsPerPage - 1)

      if (searchBloqueados) {
        query = query.or(`nome.ilike.%${searchBloqueados}%,telefone.ilike.%${searchBloqueados}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar bloqueados:', error)
        setBloqueados([])
      } else {
        setBloqueados(data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar bloqueados:', error)
      setBloqueados([])
    }
  }

  const handleBloquear = async (conversaId: string) => {
    try {
      const motivo = prompt('Motivo do bloqueio (opcional):') || undefined

      const response = await fetch(`/api/conversas/bloquear?action=bloquear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversa_id: conversaId,
          motivo,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao bloquear')
      }

      await fetchClientes()
      await fetchBloqueados()
    } catch (error: any) {
      console.error('Erro ao bloquear:', error)
      alert('Erro ao bloquear: ' + error.message)
    }
  }

  const handleDesbloquear = async (conversaId: string) => {
    try {
      const response = await fetch(`/api/conversas/bloquear?action=desbloquear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversa_id: conversaId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao desbloquear')
      }

      await fetchClientes()
      await fetchBloqueados()
    } catch (error: any) {
      console.error('Erro ao desbloquear:', error)
      alert('Erro ao desbloquear: ' + error.message)
    }
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <Header
        title="Bloqueio de Clientes"
        subtitle="Gerencie clientes bloqueados"
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Lista de Clientes */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Lista de Clientes</h2>
              </div>
              <button className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300">
                <Info className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Filtros */}
              <div className="space-y-2">
                <select
                  value={canalClientes}
                  onChange={(e) => setCanalClientes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm"
                >
                  <option value="">Por canal</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por"
                    value={searchClientes}
                    onChange={(e) => setSearchClientes(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchClientes()
                      }
                    }}
                    className="pl-10 !bg-white !text-black text-sm"
                  />
                </div>
              </div>

              {/* Lista */}
              <div className="min-h-[400px] max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                  </div>
                ) : clientes.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-600">Nenhum cliente encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientes.map((cliente) => (
                      <div
                        key={cliente.id}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{cliente.nome || 'Sem nome'}</p>
                          <p className="text-xs text-gray-500 truncate">{cliente.telefone}</p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleBloquear(cliente.id)}
                          className="!bg-red-100 hover:!bg-red-200 !text-red-700"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-center gap-2 pt-3 border-t border-gray-200">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPageClientes(1)}
                  disabled={pageClientes === 1}
                  className="!bg-gray-100 hover:!bg-gray-200"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPageClientes(prev => Math.max(1, prev - 1))}
                  disabled={pageClientes === 1}
                  className="!bg-gray-100 hover:!bg-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-sm font-medium">
                  {pageClientes}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPageClientes(prev => prev + 1)}
                  disabled={clientes.length < itemsPerPage}
                  className="!bg-gray-100 hover:!bg-gray-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPageClientes(999)}
                  disabled={clientes.length < itemsPerPage}
                  className="!bg-gray-100 hover:!bg-gray-200"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Clientes Bloqueados */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Clientes bloqueados</h2>
              </div>
              <button className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300">
                <Info className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Filtros */}
              <div className="space-y-2">
                <select
                  value={canalBloqueados}
                  onChange={(e) => setCanalBloqueados(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm"
                >
                  <option value="">Por canal</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por"
                    value={searchBloqueados}
                    onChange={(e) => setSearchBloqueados(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchBloqueados()
                      }
                    }}
                    className="pl-10 !bg-white !text-black text-sm"
                  />
                </div>
              </div>

              {/* Lista */}
              <div className="min-h-[400px] max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                  </div>
                ) : bloqueados.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-600">Nenhum cliente bloqueado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bloqueados.map((bloqueado) => (
                      <div
                        key={bloqueado.id}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{bloqueado.nome || 'Sem nome'}</p>
                          <p className="text-xs text-gray-500 truncate">{bloqueado.telefone}</p>
                          {bloqueado.motivo_bloqueio && (
                            <p className="text-xs text-red-600 mt-1">Motivo: {bloqueado.motivo_bloqueio}</p>
                          )}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDesbloquear(bloqueado.id)}
                          className="!bg-green-100 hover:!bg-green-200 !text-green-700"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-center gap-2 pt-3 border-t border-gray-200">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPageBloqueados(1)}
                  disabled={pageBloqueados === 1}
                  className="!bg-gray-100 hover:!bg-gray-200"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPageBloqueados(prev => Math.max(1, prev - 1))}
                  disabled={pageBloqueados === 1}
                  className="!bg-gray-100 hover:!bg-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-sm font-medium">
                  {pageBloqueados}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPageBloqueados(prev => prev + 1)}
                  disabled={bloqueados.length < itemsPerPage}
                  className="!bg-gray-100 hover:!bg-gray-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPageBloqueados(999)}
                  disabled={bloqueados.length < itemsPerPage}
                  className="!bg-gray-100 hover:!bg-gray-200"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

