'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Shield, Plus, Edit2, Trash2, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { useFaculdade } from '@/contexts/FaculdadeContext'

interface Permission {
    id: string
    nome: string
    descricao: string | null
    recurso: string
    acao: string
}

interface Role {
    id: string
    nome: string
    descricao: string | null
    permissions?: Permission[]
}

export function RoleManager() {
    const { showToast } = useToast()
    const { faculdadeSelecionada } = useFaculdade()
    const [roles, setRoles] = useState<Role[]>([])
    const [permissions, setPermissions] = useState<Record<string, Permission[]>>({})
    const [loading, setLoading] = useState(true)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [expandedRole, setExpandedRole] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({ nome: '', descricao: '' })

    useEffect(() => {
        fetchRoles()
        fetchPermissions()
    }, [])

    const fetchRoles = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/rbac/roles?faculdade_id=${faculdadeSelecionada?.id}`)
            const data = await response.json()
            setRoles(data.roles || [])
        } catch (error) {
            console.error('Error fetching roles:', error)
            showToast('Erro ao carregar roles', 'error')
        } finally {
            setLoading(false)
        }
    }

    const fetchPermissions = async () => {
        try {
            const response = await fetch(`/api/rbac/permissions?faculdade_id=${faculdadeSelecionada?.id}`)
            const data = await response.json()
            setPermissions(data.grouped || {})
        } catch (error) {
            console.error('Error fetching permissions:', error)
            showToast('Erro ao carregar permissões', 'error')
        }
    }

    const fetchRoleDetails = async (roleId: string) => {
        try {
            const response = await fetch(`/api/rbac/roles?role_id=${roleId}&faculdade_id=${faculdadeSelecionada?.id}`)
            const data = await response.json()
            setSelectedRole(data.role)
            setExpandedRole(roleId)
        } catch (error) {
            console.error('Error fetching role details:', error)
            showToast('Erro ao carregar detalhes do role', 'error')
        }
    }

    const handleCreateRole = async () => {
        if (!formData.nome) {
            showToast('Nome é obrigatório', 'warning')
            return
        }

        try {
            const response = await fetch('/api/rbac/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    faculdade_id: faculdadeSelecionada?.id
                })
            })

            if (!response.ok) {
                throw new Error('Failed to create role')
            }

            showToast('Role criado com sucesso', 'success')
            setIsCreating(false)
            setFormData({ nome: '', descricao: '' })
            fetchRoles()
        } catch (error) {
            console.error('Error creating role:', error)
            showToast('Erro ao criar role', 'error')
        }
    }

    const handleUpdateRole = async () => {
        if (!selectedRole || !formData.nome) {
            showToast('Nome é obrigatório', 'warning')
            return
        }

        try {
            const response = await fetch('/api/rbac/roles', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role_id: selectedRole.id,
                    ...formData,
                    faculdade_id: faculdadeSelecionada?.id
                })
            })

            if (!response.ok) {
                throw new Error('Failed to update role')
            }

            showToast('Role atualizado com sucesso', 'success')
            setIsEditing(false)
            setFormData({ nome: '', descricao: '' })
            fetchRoles()
            if (selectedRole) {
                fetchRoleDetails(selectedRole.id)
            }
        } catch (error) {
            console.error('Error updating role:', error)
            showToast('Erro ao atualizar role', 'error')
        }
    }

    const handleDeleteRole = async (roleId: string) => {
        if (!confirm('Tem certeza que deseja deletar este role?')) {
            return
        }

        try {
            const response = await fetch(`/api/rbac/roles?role_id=${roleId}&faculdade_id=${faculdadeSelecionada?.id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to delete role')
            }

            showToast('Role deletado com sucesso', 'success')
            setSelectedRole(null)
            setExpandedRole(null)
            fetchRoles()
        } catch (error) {
            console.error('Error deleting role:', error)
            showToast('Erro ao deletar role', 'error')
        }
    }

    const handleTogglePermission = async (permissionId: string, hasPermission: boolean) => {
        if (!selectedRole) return

        try {
            if (hasPermission) {
                // Remove permission
                const response = await fetch(
                    `/api/rbac/assign?type=role_permission&role_id=${selectedRole.id}&permission_id=${permissionId}&faculdade_id=${faculdadeSelecionada?.id}`,
                    { method: 'DELETE' }
                )

                if (!response.ok) throw new Error('Failed to remove permission')
                showToast('Permissão removida', 'success')
            } else {
                // Add permission
                const response = await fetch('/api/rbac/assign', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'role_permission',
                        role_id: selectedRole.id,
                        permission_id: permissionId,
                        faculdade_id: faculdadeSelecionada?.id
                    })
                })

                if (!response.ok) throw new Error('Failed to add permission')
                showToast('Permissão adicionada', 'success')
            }

            // Refresh role details
            fetchRoleDetails(selectedRole.id)
        } catch (error) {
            console.error('Error toggling permission:', error)
            showToast('Erro ao atualizar permissão', 'error')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Roles</h2>
                    <p className="text-gray-600">Gerencie roles e suas permissões</p>
                </div>
                <Button
                    onClick={() => {
                        setIsCreating(true)
                        setFormData({ nome: '', descricao: '' })
                    }}
                    className="!bg-indigo-600 hover:!bg-indigo-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Role
                </Button>
            </div>

            {/* Create/Edit Form */}
            {(isCreating || isEditing) && (
                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {isCreating ? 'Criar Novo Role' : 'Editar Role'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                            <Input
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                placeholder="Ex: gerente_vendas"
                                className="!bg-white !text-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                            <Input
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                placeholder="Descrição do role"
                                className="!bg-white !text-black"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={isCreating ? handleCreateRole : handleUpdateRole}
                                className="!bg-green-600 hover:!bg-green-700"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                {isCreating ? 'Criar' : 'Salvar'}
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsCreating(false)
                                    setIsEditing(false)
                                    setFormData({ nome: '', descricao: '' })
                                }}
                                variant="secondary"
                                className="!bg-gray-200 hover:!bg-gray-300 !text-gray-900"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Roles List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Roles */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Roles</h3>
                    <div className="space-y-2">
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                className={`p-3 rounded-lg border transition-colors cursor-pointer ${expandedRole === role.id
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                onClick={() => {
                                    if (expandedRole === role.id) {
                                        setExpandedRole(null)
                                        setSelectedRole(null)
                                    } else {
                                        fetchRoleDetails(role.id)
                                    }
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {expandedRole === role.id ? (
                                            <ChevronDown className="w-4 h-4 text-gray-600" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-600" />
                                        )}
                                        <Shield className="w-5 h-5 text-indigo-600" />
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{role.nome}</h4>
                                            {role.descricao && (
                                                <p className="text-sm text-gray-600">{role.descricao}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedRole(role)
                                                setFormData({ nome: role.nome, descricao: role.descricao || '' })
                                                setIsEditing(true)
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteRole(role.id)
                                            }}
                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Permissions */}
                {selectedRole && (
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Permissões de "{selectedRole.nome}"
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(permissions).map(([recurso, perms]) => (
                                <div key={recurso} className="border border-gray-200 rounded-lg p-3">
                                    <h4 className="font-semibold text-gray-900 mb-2 capitalize">{recurso}</h4>
                                    <div className="space-y-2">
                                        {perms.map((perm) => {
                                            const hasPermission = selectedRole.permissions?.some(
                                                (p) => p.id === perm.id
                                            )
                                            return (
                                                <label
                                                    key={perm.id}
                                                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={hasPermission}
                                                        onChange={() => handleTogglePermission(perm.id, hasPermission || false)}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-900">{perm.acao}</span>
                                                        {perm.descricao && (
                                                            <p className="text-xs text-gray-600">{perm.descricao}</p>
                                                        )}
                                                    </div>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}
