'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Bot, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  FileText
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { AgenteIA } from '@/types/supabase'
import { AgenteModal } from '@/components/dashboard/AgenteModal'

export default function AgentesIAPage() {
  const { faculdadeSelecionada, faculdades } = useFaculdade()
  const [agentes, setAgentes] = useState<AgenteIA[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroFaculdade, setFiltroFaculdade] = useState<string>('')
  const [filtroSetor, setFiltroSetor] = useState<string>('')
  const [agenteSelecionado, setAgenteSelecionado] = useState<AgenteIA | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)

  const fetchAgentes = useCallback(async () => {
    // Buscar todos os agentes se não houver faculdade selecionada, ou filtrar por faculdade
    try {
      setLoading(true)
      
      let query = supabase
        .from('agentes_ia')
        .select('*')

      // Se há faculdade selecionada no contexto, usa ela, senão permite escolher
      if (faculdadeSelecionada && !filtroFaculdade) {
        query = query.eq('faculdade_id', faculdadeSelecionada.id)
      } else if (filtroFaculdade) {
        query = query.eq('faculdade_id', filtroFaculdade)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar agentes:', error)
        setAgentes([])
        return
      }

      setAgentes(data || [])
    } catch (error: any) {
      console.error('Erro inesperado ao buscar agentes:', error?.message || error)
      setAgentes([])
    } finally {
      setLoading(false)
    }
  }, [faculdadeSelecionada, filtroFaculdade])

  useEffect(() => {
    fetchAgentes()
  }, [fetchAgentes])

  const handleNovoAgente = () => {
    setAgenteSelecionado(null)
    setModoEdicao(false)
    setModalAberto(true)
  }

  const handleEditarAgente = (agente: AgenteIA) => {
    setAgenteSelecionado(agente)
    setModoEdicao(true)
    setModalAberto(true)
  }

  const handleExcluirAgente = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este agente?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('agentes_ia')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchAgentes()
    } catch (error: any) {
      console.error('Erro ao excluir agente:', error)
      alert('Erro ao excluir agente: ' + error.message)
    }
  }

  const handleToggleAtivo = async (agente: AgenteIA) => {
    try {
      const { error } = await supabase
        .from('agentes_ia')
        .update({ ativo: !agente.ativo })
        .eq('id', agente.id)

      if (error) throw error

      await fetchAgentes()
    } catch (error: any) {
      console.error('Erro ao atualizar status do agente:', error)
      alert('Erro ao atualizar status: ' + error.message)
    }
  }

  const agentesFiltrados = agentes.filter(agente => {
    const matchSearch = agente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (agente.descricao || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchSetor = !filtroSetor || agente.setor === filtroSetor
    return matchSearch && matchSetor
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Header
          title="Agentes IA"
          subtitle="Gerencie seus agentes de inteligência artificial"
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Header
        title="Agentes IA"
        subtitle="Gerencie seus agentes de inteligência artificial"
      />
      
      <div className="p-8 space-y-6">
        {/* Ações e Busca */}
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar agentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleNovoAgente} className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Novo Agente
              </Button>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro Faculdade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por Faculdade
                </label>
                <select
                  value={filtroFaculdade}
                  onChange={(e) => setFiltroFaculdade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-black bg-white"
                >
                  <option value="">Todas as faculdades</option>
                  {faculdades.map((faculdade) => (
                    <option key={faculdade.id} value={faculdade.id}>
                      {faculdade.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Setor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por Setor
                </label>
                <select
                  value={filtroSetor}
                  onChange={(e) => setFiltroSetor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-black bg-white"
                >
                  <option value="">Todos os setores</option>
                  <option value="Suporte">Suporte</option>
                  <option value="Vendas">Vendas</option>
                  <option value="Atendimento">Atendimento</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de Agentes */}
        {agentesFiltrados.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Nenhum agente encontrado' : 'Nenhum agente cadastrado'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? 'Tente ajustar sua busca'
                  : 'Comece criando seu primeiro agente de IA'}
              </p>
              {!searchTerm && (
                <Button onClick={handleNovoAgente}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Agente
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentesFiltrados.map((agente) => (
              <Card key={agente.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                        <Bot className="w-6 h-6 text-cyan-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{agente.nome}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={agente.ativo ? 'success' : 'danger'}>
                            {agente.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {agente.setor && (
                            <Badge variant="info">
                              {agente.setor}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {agente.descricao && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {agente.descricao}
                    </p>
                  )}

                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span>
                    {agente.script_atendimento.length} caracteres
                  </span>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditarAgente(agente)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleAtivo(agente)}
                    className="flex-1"
                  >
                    {agente.ativo ? (
                      <>
                        <PowerOff className="w-4 h-4 mr-1" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4 mr-1" />
                        Ativar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExcluirAgente(agente.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      <AgenteModal
        aberto={modalAberto}
        onClose={() => {
          setModalAberto(false)
          setAgenteSelecionado(null)
        }}
        agente={agenteSelecionado}
        modoEdicao={modoEdicao}
        onSuccess={fetchAgentes}
      />
    </div>
  )
}

