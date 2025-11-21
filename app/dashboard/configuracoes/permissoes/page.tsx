'use client'

import { Header } from '@/components/dashboard/Header'
import { RoleManager } from '@/components/rbac/RoleManager'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function PermissoesPageContent() {
    return (
        <div className="min-h-screen bg-white text-black">
            <Header
                title="Gerenciamento de Permissões"
                subtitle="Configure roles e permissões de usuários"
            />

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
