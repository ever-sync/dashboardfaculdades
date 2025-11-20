'use client'

import { ReactNode } from 'react'
import { usePermissions } from '@/contexts/PermissionsContext'

interface CanProps {
    do: string // ação
    on: string // recurso
    children: ReactNode
    fallback?: ReactNode
}

export function Can({ do: acao, on: recurso, children, fallback = null }: CanProps) {
    const { can, loading } = usePermissions()

    if (loading) {
        return null
    }

    if (!can(recurso, acao)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
