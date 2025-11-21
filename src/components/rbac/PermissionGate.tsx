'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { useEffect, useState } from 'react'

interface PermissionGateProps {
    children: ReactNode
    permission: string | string[]
    fallback?: ReactNode
    requireAll?: boolean // If true, requires all permissions. If false, requires any permission
}

/**
 * Component to conditionally render content based on user permissions
 * 
 * @example
 * <PermissionGate permission="relatorios.export">
 *   <ExportButton />
 * </PermissionGate>
 * 
 * @example Multiple permissions (any)
 * <PermissionGate permission={["conversas.write", "conversas.assign"]}>
 *   <EditButton />
 * </PermissionGate>
 * 
 * @example Multiple permissions (all required)
 * <PermissionGate permission={["conversas.write", "conversas.delete"]} requireAll>
 *   <DeleteButton />
 * </PermissionGate>
 */
export function PermissionGate({
    children,
    permission,
    fallback = null,
    requireAll = false
}: PermissionGateProps) {
    const { faculdadeSelecionada } = useFaculdade()
    const [hasPermission, setHasPermission] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkPermission = async () => {
            if (!faculdadeSelecionada) {
                setHasPermission(false)
                setLoading(false)
                return
            }

            try {
                const permissions = Array.isArray(permission) ? permission : [permission]

                // Get user permissions from API
                const response = await fetch(
                    `/api/rbac/user-permissions?faculdade_id=${faculdadeSelecionada.id}`
                )

                if (!response.ok) {
                    setHasPermission(false)
                    setLoading(false)
                    return
                }

                const { permissions: userPermissions } = await response.json()
                const userPermissionNames = userPermissions.map((p: any) => p.nome)

                // Check if user has required permissions
                let hasRequiredPermission = false

                if (requireAll) {
                    // User must have ALL permissions
                    hasRequiredPermission = permissions.every(perm =>
                        userPermissionNames.includes(perm)
                    )
                } else {
                    // User must have ANY permission
                    hasRequiredPermission = permissions.some(perm =>
                        userPermissionNames.includes(perm)
                    )
                }

                setHasPermission(hasRequiredPermission)
            } catch (error) {
                console.error('Error checking permission:', error)
                setHasPermission(false)
            } finally {
                setLoading(false)
            }
        }

        checkPermission()
    }, [permission, faculdadeSelecionada, requireAll])

    if (loading) {
        return null // Or a loading skeleton
    }

    if (!hasPermission) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

/**
 * Hook to check permissions programmatically
 */
export function usePermission(permission: string | string[], requireAll = false) {
    const { faculdadeSelecionada } = useFaculdade()
    const [hasPermission, setHasPermission] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkPermission = async () => {
            if (!faculdadeSelecionada) {
                setHasPermission(false)
                setLoading(false)
                return
            }

            try {
                const permissions = Array.isArray(permission) ? permission : [permission]

                const response = await fetch(
                    `/api/rbac/user-permissions?faculdade_id=${faculdadeSelecionada.id}`
                )

                if (!response.ok) {
                    setHasPermission(false)
                    setLoading(false)
                    return
                }

                const { permissions: userPermissions } = await response.json()
                const userPermissionNames = userPermissions.map((p: any) => p.nome)

                let hasRequiredPermission = false

                if (requireAll) {
                    hasRequiredPermission = permissions.every(perm =>
                        userPermissionNames.includes(perm)
                    )
                } else {
                    hasRequiredPermission = permissions.some(perm =>
                        userPermissionNames.includes(perm)
                    )
                }

                setHasPermission(hasRequiredPermission)
            } catch (error) {
                console.error('Error checking permission:', error)
                setHasPermission(false)
            } finally {
                setLoading(false)
            }
        }

        checkPermission()
    }, [permission, faculdadeSelecionada, requireAll])

    return { hasPermission, loading }
}
