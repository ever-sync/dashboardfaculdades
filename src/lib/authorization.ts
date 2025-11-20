import { createClient } from '@/lib/supabase-server'

export type Role = 'admin' | 'gerente' | 'atendente'

export interface Permission {
    nome: string
    recurso: string
    acao: string
}

export interface User {
    id: string
    email: string
    role: Role
    faculdade_id?: string
}

/**
 * Verifica se um usuário tem uma permissão específica
 */
export async function hasPermission(
    userId: string,
    recurso: string,
    acao: string
): Promise<boolean> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('usuario_tem_permissao', {
            p_usuario_id: userId,
            p_recurso: recurso,
            p_acao: acao
        })

    if (error) {
        console.error('Erro ao verificar permissão:', error)
        return false
    }

    return data === true
}

/**
 * Busca todas as permissões de um usuário
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('buscar_permissoes_usuario', {
            p_usuario_id: userId
        })

    if (error) {
        console.error('Erro ao buscar permissões:', error)
        return []
    }

    return (data || []).map((p: any) => ({
        nome: p.permissao_nome,
        recurso: p.recurso,
        acao: p.acao
    }))
}

/**
 * Verifica se um usuário tem um dos roles especificados
 */
export async function hasRole(userId: string, roles: Role[]): Promise<boolean> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', userId)
        .single()

    if (error || !data) {
        return false
    }

    return roles.includes(data.role as Role)
}

/**
 * Busca o role de um usuário
 */
export async function getUserRole(userId: string): Promise<Role | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', userId)
        .single()

    if (error || !data) {
        return null
    }

    return data.role as Role
}

/**
 * Verifica se um usuário pode acessar uma rota
 */
export async function canAccessRoute(userId: string, route: string): Promise<boolean> {
    // Mapeamento de rotas para permissões necessárias
    const routePermissions: Record<string, { recurso: string; acao: string }> = {
        '/dashboard/admin': { recurso: 'permissoes', acao: 'gerenciar' },
        '/dashboard/faculdades/criar': { recurso: 'faculdades', acao: 'criar' },
        '/dashboard/faculdades/[id]/editar': { recurso: 'faculdades', acao: 'atualizar' },
        '/dashboard/usuarios': { recurso: 'usuarios', acao: 'ler' },
        '/dashboard/usuarios/criar': { recurso: 'usuarios', acao: 'criar' },
        '/dashboard/usuarios/[id]/editar': { recurso: 'usuarios', acao: 'atualizar' },
        '/dashboard/relatorios': { recurso: 'relatorios', acao: 'ler' },
        '/dashboard/metricas': { recurso: 'metricas', acao: 'ler' },
        '/dashboard/agentes-ia/criar': { recurso: 'agentes_ia', acao: 'criar' },
        '/dashboard/agentes-ia/[id]/editar': { recurso: 'agentes_ia', acao: 'atualizar' },
        '/dashboard/conversas': { recurso: 'conversas', acao: 'ler' },
        '/dashboard/prospects': { recurso: 'prospects', acao: 'ler' },
        '/dashboard/crm': { recurso: 'conversas', acao: 'ler' },
    }

    // Normalizar rota (remover parâmetros dinâmicos)
    const normalizedRoute = route.replace(/\/\d+/g, '/[id]')

    const permission = routePermissions[normalizedRoute]

    if (!permission) {
        // Se a rota não está mapeada, permitir acesso (rotas públicas do dashboard)
        return true
    }

    return hasPermission(userId, permission.recurso, permission.acao)
}

/**
 * Filtra uma lista de itens baseado em permissões
 */
export async function filterByPermission<T extends { id: string }>(
    userId: string,
    items: T[],
    recurso: string,
    acao: string
): Promise<T[]> {
    const canAccess = await hasPermission(userId, recurso, acao)

    if (!canAccess) {
        return []
    }

    return items
}

/**
 * Middleware helper para verificar permissão em API routes
 */
export async function requirePermission(
    userId: string,
    recurso: string,
    acao: string
): Promise<{ authorized: boolean; error?: string }> {
    if (!userId) {
        return { authorized: false, error: 'Usuário não autenticado' }
    }

    const canAccess = await hasPermission(userId, recurso, acao)

    if (!canAccess) {
        return { authorized: false, error: 'Permissão negada' }
    }

    return { authorized: true }
}

/**
 * Middleware helper para verificar role em API routes
 */
export async function requireRole(
    userId: string,
    roles: Role[]
): Promise<{ authorized: boolean; error?: string }> {
    if (!userId) {
        return { authorized: false, error: 'Usuário não autenticado' }
    }

    const userHasRole = await hasRole(userId, roles)

    if (!userHasRole) {
        return { authorized: false, error: 'Acesso negado' }
    }

    return { authorized: true }
}
