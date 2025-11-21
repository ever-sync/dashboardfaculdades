'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { Usuario } from '@/types/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Header } from '@/components/dashboard/Header'
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Search,
  Filter,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  UserCheck,
  UserX
} from 'lucide-react'

interface AtendenteModalProps {
  isOpen: boolean
  onClose: () => void
  atendente?: Usuario | null
  onSave: () => void
  faculdadeId: string
}

function AtendenteModal({ isOpen, onClose, atendente, onSave, faculdadeId }: AtendenteModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    setor: 'Atendimento' as 'Suporte' | 'Vendas' | 'Atendimento',
    status: 'offline' as 'online' | 'offline' | 'ausente' | 'ocupado',
    carga_trabalho_maxima: 10,
    horario_trabalho_inicio: '08:00',
    horario_trabalho_fim: '18:00',
    dias_trabalho: [1, 2, 3, 4, 5] as number[], // 1=Segunda, 2=Terça, etc.
    ativo: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (atendente) {
      setFormData({
        nome: atendente.nome,
        email: atendente.email,
        setor: atendente.setor || 'Atendimento',
        status: atendente.status,
        carga_trabalho_maxima: atendente.carga_trabalho_maxima,
        horario_trabalho_inicio: atendente.horario_trabalho_inicio.substring(0, 5),
        horario_trabalho_fim: atendente.horario_trabalho_fim.substring(0, 5),
        dias_trabalho: atendente.dias_trabalho || [1, 2, 3, 4, 5],
        ativo: atendente.ativo,
      })
    } else {
      setFormData({
        nome: '',
        email: '',
        setor: 'Atendimento',
        status: 'offline',
        carga_trabalho_maxima: 10,
        horario_trabalho_inicio: '08:00',
        horario_trabalho_fim: '18:00',
        dias_trabalho: [1, 2, 3, 4, 5],
        ativo: true,
      })
    }
    setError(null)
  }, [atendente, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const dataToSave: any = {
        faculdade_id: faculdadeId,
        nome: formData.nome,
        email: formData.email,
        setor: formData.setor,
        status: formData.status,
        carga_trabalho_maxima: formData.carga_trabalho_maxima,
        horario_trabalho_inicio: `${formData.horario_trabalho_inicio}:00`,
        horario_trabalho_fim: `${formData.horario_trabalho_fim}:00`,
        dias_trabalho: formData.dias_trabalho,
        ativo: formData.ativo,
      }

      if (atendente) {
        const { error: updateError } = await (supabase.from('usuarios') as any)
          .update(dataToSave)
          .eq('id', atendente.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await (supabase.from('usuarios') as any)
          .insert(dataToSave)

        if (insertError) throw insertError
      }

      onSave()
      onClose()
    } catch (err: any) {
      console.error('Erro ao salvar atendente:', err)
      setError(err.message || 'Erro ao salvar atendente')
    } finally {
      setLoading(false)
    }
  }

  const toggleDiaTrabalho = (dia: number) => {
    setFormData({
      ...formData,
      dias_trabalho: formData.dias_trabalho.includes(dia)
        ? formData.dias_trabalho.filter(d => d !== dia)
        : [...formData.dias_trabalho, dia],
    })
  }

  const diasSemana = [
    { num: 1, label: 'Segunda' },
    { num: 2, label: 'Terça' },
    { num: 3, label: 'Quarta' },
    { num: 4, label: 'Quinta' },
    { num: 5, label: 'Sexta' },
    { num: 6, label: 'Sábado' },
    { num: 7, label: 'Domingo' },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {atendente ? 'Editar Atendente' : 'Novo Atendente'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <XCircle className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Nome *
              </label>
              <Input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="!bg-white !text-black"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="!bg-white !text-black"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Setor *
              </label>
              <select
                value={formData.setor}
                onChange={(e) => setFormData({ ...formData, setor: e.target.value as any })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent !bg-white !text-black"
                disabled={loading}
              >
                <option value="Suporte">Suporte</option>
                <option value="Vendas">Vendas</option>
                <option value="Atendimento">Atendimento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent !bg-white !text-black"
                disabled={loading}
              >
                <option value="offline">Offline</option>
                <option value="online">Online</option>
                <option value="ausente">Ausente</option>
                <option value="ocupado">Ocupado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Carga Máxima de Conversas
              </label>
              <Input
                type="number"
                min="1"
                max="50"
                value={formData.carga_trabalho_maxima}
                onChange={(e) => setFormData({ ...formData, carga_trabalho_maxima: parseInt(e.target.value) || 10 })}
                className="!bg-white !text-black"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Horário de Trabalho
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Início</label>
                  <Input
                    type="time"
                    value={formData.horario_trabalho_inicio}
                    onChange={(e) => setFormData({ ...formData, horario_trabalho_inicio: e.target.value })}
                    className="!bg-white !text-black"
                    disabled={loading}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Fim</label>
                  <Input
                    type="time"
                    value={formData.horario_trabalho_fim}
                    onChange={(e) => setFormData({ ...formData, horario_trabalho_fim: e.target.value })}
                    className="!bg-white !text-black"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Dias de Trabalho
              </label>
              <div className="flex flex-wrap gap-2">
                {diasSemana.map((dia) => (
                  <button
                    key={dia.num}
                    type="button"
                    onClick={() => toggleDiaTrabalho(dia.num)}
                    className={`px-3 py-2 rounded-lg border-2 transition-colors ${formData.dias_trabalho.includes(dia.num)
                      ? 'border-gray-900 bg-gray-50 text-gray-900'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    disabled={loading}
                  >
                    {dia.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-300"
                  disabled={loading}
                />
                <span className="text-sm font-medium text-gray-900">Ativo</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              <div className="font-semibold mb-2">⚠️ Erro ao salvar atendente</div>
              <div className="mb-2">{error}</div>
              {error.includes('usuarios') && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <div className="font-medium mb-1">💡 Como resolver:</div>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-red-700">
                    <li>Acesse o Dashboard do Supabase</li>
                    <li>Vá em SQL Editor</li>
                    <li>Execute a migration: <code className="bg-red-100 px-1 rounded">014_create_usuarios_table.sql</code></li>
                    <li>Veja instruções detalhadas em: <code className="bg-red-100 px-1 rounded">MIGRACAO_USUARIOS.md</code></li>
                  </ol>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="!bg-gray-900 hover:!bg-gray-800"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{atendente ? 'Atualizar' : 'Criar'}</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AtendentesPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const [atendentes, setAtendentes] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSetor, setFilterSetor] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [atendenteEditando, setAtendenteEditando] = useState<Usuario | null>(null)
  const [deletando, setDeletando] = useState<string | null>(null)
  const [erroTabela, setErroTabela] = useState(false)

  const fetchAtendentes = useCallback(async () => {
    if (!faculdadeSelecionada) {
      setAtendentes([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      let query = supabase
        .from('usuarios')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .order('nome')

      if (filterSetor) {
        query = query.eq('setor', filterSetor)
      }

      if (filterStatus) {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar atendentes:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })

        // Se a tabela não existe, mostrar mensagem específica
        if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('não existe')) {
          console.error('⚠️ Tabela "usuarios" não encontrada. Execute a migração: supabase/migrations/014_create_usuarios_table.sql')
          setErroTabela(true)
        }

        setAtendentes([])
        return
      }

      setAtendentes(data || [])
      setErroTabela(false)
    } catch (error: any) {
      console.error('Erro ao buscar atendentes:', {
        message: error?.message || 'Erro desconhecido',
        stack: error?.stack,
        fullError: error
      })
      setAtendentes([])
    } finally {
      setLoading(false)
    }
  }, [faculdadeSelecionada, filterSetor, filterStatus])

  useEffect(() => {
    fetchAtendentes()
  }, [fetchAtendentes])

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este atendente?')) return

    try {
      setDeletando(id)
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchAtendentes()
    } catch (error: any) {
      console.error('Erro ao excluir atendente:', error)
      alert('Erro ao excluir atendente: ' + error.message)
    } finally {
      setDeletando(null)
    }
  }

  const handleToggleAtivo = async (atendente: Usuario) => {
    try {
      const updateData = { ativo: !atendente.ativo }
      const { error } = await (supabase.from('usuarios') as any)
        .update(updateData)
        .eq('id', atendente.id)

      if (error) throw error

      await fetchAtendentes()
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status: ' + error.message)
    }
  }

  const atendentesFiltrados = atendentes.filter((atendente) =>
    atendente.nome.toLowerCase().includes(search.toLowerCase()) ||
    atendente.email.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; icon: any; label: string }> = {
      online: { variant: 'success', icon: UserCheck, label: 'Online' },
      offline: { variant: 'secondary', icon: UserX, label: 'Offline' },
      ausente: { variant: 'warning', icon: Clock, label: 'Ausente' },
      ocupado: { variant: 'danger', icon: AlertCircle, label: 'Ocupado' },
    }
    return statusMap[status] || statusMap.offline
  }

  if (!faculdadeSelecionada) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Selecione uma faculdade
            </h3>
            <p className="text-gray-600">
              Por favor, selecione uma faculdade para visualizar os atendentes.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Header
        title="Gestão de Atendentes"
        subtitle="Gerencie seus atendentes e suas configurações"
      />

      {/* Filtros e Busca */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 !bg-white !text-black"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterSetor}
              onChange={(e) => setFilterSetor(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent !bg-white !text-black"
            >
              <option value="">Todos os Setores</option>
              <option value="Suporte">Suporte</option>
              <option value="Vendas">Vendas</option>
              <option value="Atendimento">Atendimento</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent !bg-white !text-black"
            >
              <option value="">Todos os Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="ausente">Ausente</option>
              <option value="ocupado">Ocupado</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{atendentes.length}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Online</p>
              <p className="text-2xl font-bold text-green-600">
                {atendentes.filter(a => a.status === 'online' && a.ativo).length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Offline</p>
              <p className="text-2xl font-bold text-gray-600">
                {atendentes.filter(a => a.status === 'offline' && a.ativo).length}
              </p>
            </div>
            <UserX className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inativos</p>
              <p className="text-2xl font-bold text-red-600">
                {atendentes.filter(a => !a.ativo).length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Botão Novo */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setAtendenteEditando(null)
            setShowModal(true)
          }}
          className="!bg-gray-900 hover:!bg-gray-800"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Atendente</span>
        </Button>
      </div>

      {/* Mensagem de erro se tabela não existir */}
      {erroTabela && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">
                ⚠️ Tabela não encontrada
              </h3>
              <p className="text-sm text-red-800 mb-2">
                A tabela <code className="bg-red-100 px-1 rounded">usuarios</code> não existe no banco de dados.
              </p>
              <p className="text-sm text-red-700">
                Execute a migração: <code className="bg-red-100 px-1 rounded">supabase/migrations/014_create_usuarios_table.sql</code>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de Atendentes */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      ) : erroTabela ? null : atendentesFiltrados.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum atendente encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              {search ? 'Tente ajustar os filtros de busca' : 'Comece criando seu primeiro atendente'}
            </p>
            {!search && (
              <Button
                onClick={() => {
                  setAtendenteEditando(null)
                  setShowModal(true)
                }}
                className="!bg-gray-900 hover:!bg-gray-800"
              >
                <UserPlus className="w-4 h-4" />
                <span>Criar Atendente</span>
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {atendentesFiltrados.map((atendente) => {
            const statusInfo = getStatusBadge(atendente.status)
            const StatusIcon = statusInfo.icon

            return (
              <Card key={atendente.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{atendente.nome}</h3>
                    <p className="text-sm text-gray-600">{atendente.email}</p>
                  </div>
                  <Badge variant={statusInfo.variant}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Setor:</span>
                    <Badge variant="info">{atendente.setor || 'N/A'}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Carga:</span>
                    <span className="font-medium text-gray-900">
                      {atendente.carga_trabalho_atual}/{atendente.carga_trabalho_maxima}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Horário:</span>
                    <span className="font-medium text-gray-900">
                      {atendente.horario_trabalho_inicio.substring(0, 5)} - {atendente.horario_trabalho_fim.substring(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    {atendente.ativo ? (
                      <Badge variant="success">Ativo</Badge>
                    ) : (
                      <Badge variant="danger">Inativo</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setAtendenteEditando(atendente)
                      setShowModal(true)
                    }}
                    className="flex-1 !bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleAtivo(atendente)}
                    className={`flex-1 ${atendente.ativo
                      ? '!bg-orange-100 hover:!bg-orange-200 !text-orange-700'
                      : '!bg-green-100 hover:!bg-green-200 !text-green-700'
                      }`}
                  >
                    {atendente.ativo ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Desativar</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ativar</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(atendente.id)}
                    disabled={deletando === atendente.id}
                    className="!bg-red-50 hover:!bg-red-100 !text-red-600"
                  >
                    {deletando === atendente.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <AtendenteModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setAtendenteEditando(null)
        }}
        atendente={atendenteEditando}
        onSave={fetchAtendentes}
        faculdadeId={faculdadeSelecionada.id}
      />
    </div>
  )
}

