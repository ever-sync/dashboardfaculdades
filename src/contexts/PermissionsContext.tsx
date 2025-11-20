'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Role, Permission } from '@/lib/authorization'

interface PermissionsContextType {
    permissions: Permission[]
    role: Role | null
    loading: boolean
    can: (recurso: string, acao: string) => boolean
    hasRole: (roles: Role[]) => boolean
    refreshPermissions: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export function PermissionsProvider({ children }: { children: ReactNode }) {
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [role, setRole] = useState<Role | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchPermissions = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/auth/me')

            if (!response.ok) {
                throw new Error('Falha ao buscar permissões')
            }

            const data = await response.json()

            setPermissions(data.permissions || [])
            setRole(data.role || null)
        } catch (error) {
            console.error('Erro ao buscar permissões:', error)
            setPermissions([])
            setRole(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPermissions()
    }, [])

    const can = (recurso: string, acao: string): boolean => {
        if (loading) return false

        // Admin tem todas as permissões
        if (role === 'admin') return true

        return permissions.some(
            p => p.recurso === recurso && p.acao === acao
        )
    }

    const hasRole = (roles: Role[]): boolean => {
        if (loading || !role) return false
        return roles.includes(role)
    }

    const refreshPermissions = async () => {
        await fetchPermissions()
    }

    return (
        <PermissionsContext.Provider
            value={{
                permissions,
                role,
                loading,
                can,
                hasRole,
                refreshPermissions
            }}
        >
            {children}
        </PermissionsContext.Provider>
    )
}

export function usePermissions() {
    const context = useContext(PermissionsContext)

    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionsProvider')
    }

    return context
}
