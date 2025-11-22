'use client'

import { Suspense } from 'react'

import { Header } from '@/components/dashboard/Header'
import { RoleManager } from '@/components/rbac/RoleManager'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function PermissoesPageContent() {
    return (
        <div className="min-h-screen bg-white text-black">
            <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse" />}>
                <Header
                    title="Gerenciamento de Permissões"
                    subtitle="Configure roles e permissões de usuários"
                />
            </Suspense>

            <div className="p-8">
                <RoleManager />
            </div>
        </div>
    )
}

export default function PermissoesPage() {
    return (
        <ProtectedRoute requiredPermission="usuarios.manage">
            <PermissoesPageContent />
        </ProtectedRoute>
    )
}
