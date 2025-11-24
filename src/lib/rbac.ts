import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================================================================
// Types
// ============================================================================

export interface Role {
    id: string
    nome: string
    descricao: string | null
    created_at: string
    updated_at: string
}

export interface Permission {
    id: string
    nome: string
    descricao: string | null
    recurso: string
    acao: string
    created_at: string
    updated_at: string
}

export interface UserRole {
    user_id: string
    role_id: string
    faculdade_id: string
    created_at: string
}

export interface RoleWithPermissions extends Role {
    permissions: Permission[]
}

// ============================================================================
// Permission Checking Functions
// ============================================================================

/**
 * Check if a user has a specific permission in a faculdade
 */
export async function hasPermission(
    userId: string,
    permissionName: string,
    faculdadeId: string
): Promise<boolean> {
    try {
        const { data, error } = await supabaseAdmin
            .rpc('user_has_permission', {
                p_user_id: userId,
                p_permission_name: permissionName,
                p_faculdade_id: faculdadeId
            })

        if (error) {
            console.error('Error checking permission:', error)
            return false
        }

        return data === true
    } catch (error) {
        console.error('Error in hasPermission:', error)
        return false
    }
}

/**
 * Get all permissions for a user in a faculdade
 */
export async function getUserPermissions(
    userId: string,
    faculdadeId: string
): Promise<Permission[]> {
    try {
        const { data, error } = await supabaseAdmin
            .rpc('get_user_permissions', {
                p_user_id: userId,
                p_faculdade_id: faculdadeId
            })

        if (error) {
            console.error('Error getting user permissions:', error)
            return []
        }

        return (data || []).map((p: any) => ({
            id: '',
            nome: p.permission_name,
            descricao: null,
            recurso: p.recurso,
            acao: p.acao,
            created_at: '',
            updated_at: ''
        }))
    } catch (error) {
        console.error('Error in getUserPermissions:', error)
        return []
    }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
    userId: string,
    permissionNames: string[],
    faculdadeId: string
): Promise<boolean> {
    const checks = await Promise.all(
        permissionNames.map(perm => hasPermission(userId, perm, faculdadeId))
    )
    return checks.some(result => result === true)
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
    userId: string,
    permissionNames: string[],
    faculdadeId: string
): Promise<boolean> {
    const checks = await Promise.all(
        permissionNames.map(perm => hasPermission(userId, perm, faculdadeId))
    )
    return checks.every(result => result === true)
}

// ============================================================================
// Role Management Functions
// ============================================================================

/**
 * Get all roles
 */
export async function getAllRoles(): Promise<Role[]> {
    const { data, error } = await supabaseAdmin
        .from('roles')
        .select('*')
        .order('nome')

    if (error) {
        console.error('Error fetching roles:', error)
        return []
    }

    return (data as any) || []
}

/**
 * Get a role by ID with its permissions
 */
export async function getRoleWithPermissions(roleId: string): Promise<RoleWithPermissions | null> {
    const { data: role, error: roleError } = await supabaseAdmin
        .from('roles')
        .select('*')
        .eq('id', roleId)
        .single()

    if (roleError || !role) {
        console.error('Error fetching role:', roleError)
        return null
    }

    const { data: rolePermissions, error: permError } = await supabaseAdmin
        .from('role_permissions')
        .select(`
      permission_id,
      permissions (*)
    `)
        .eq('role_id', roleId)

    if (permError) {
        console.error('Error fetching role permissions:', permError)
        return { ...(role as any), permissions: [] }
    }

    const permissions = ((rolePermissions as any) || [])
        .map((rp: any) => rp.permissions)
        .filter(Boolean)

    return { ...(role as any), permissions }
}

/**
 * Get user roles in a faculdade
 */
export async function getUserRoles(
    userId: string,
    faculdadeId: string
): Promise<Role[]> {
    const { data, error } = await supabaseAdmin
        .from('user_roles')
        .select(`
      role_id,
      roles (*)
    `)
        .eq('user_id', userId)
        .eq('faculdade_id', faculdadeId)

    if (error) {
        console.error('Error fetching user roles:', error)
        return []
    }

    return (data || []).map((ur: any) => ur.roles).filter(Boolean)
}

/**
 * Assign a role to a user in a faculdade
 */
export async function assignRole(
    userId: string,
    roleId: string,
    faculdadeId: string
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin
        .from('user_roles')
        .insert({
            user_id: userId,
            role_id: roleId,
            faculdade_id: faculdadeId
        })

    if (error) {
        console.error('Error assigning role:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Remove a role from a user in a faculdade
 */
export async function removeRole(
    userId: string,
    roleId: string,
    faculdadeId: string
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .eq('faculdade_id', faculdadeId)

    if (error) {
        console.error('Error removing role:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// ============================================================================
// Permission Management Functions
// ============================================================================

/**
 * Get all permissions
 */
export async function getAllPermissions(): Promise<Permission[]> {
    const { data, error } = await supabaseAdmin
        .from('permissions')
        .select('*')
        .order('recurso, acao')

    if (error) {
        console.error('Error fetching permissions:', error)
        return []
    }

    return (data as any) || []
}

/**
 * Get permissions by resource
 */
export async function getPermissionsByResource(recurso: string): Promise<Permission[]> {
    const { data, error } = await supabaseAdmin
        .from('permissions')
        .select('*')
        .eq('recurso', recurso)
        .order('acao')

    if (error) {
        console.error('Error fetching permissions by resource:', error)
        return []
    }

    return (data as any) || []
}

/**
 * Assign a permission to a role
 */
export async function assignPermissionToRole(
    roleId: string,
    permissionId: string
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin
        .from('role_permissions')
        .insert({
            role_id: roleId,
            permission_id: permissionId
        })

    if (error) {
        console.error('Error assigning permission to role:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Remove a permission from a role
 */
export async function removePermissionFromRole(
    roleId: string,
    permissionId: string
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('permission_id', permissionId)

    if (error) {
        console.error('Error removing permission from role:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Create a new role
 */
export async function createRole(
    nome: string,
    descricao?: string
): Promise<{ success: boolean; role?: Role; error?: string }> {
    const { data, error } = await supabaseAdmin
        .from('roles')
        .insert({
            nome,
            descricao
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating role:', error)
        return { success: false, error: error.message }
    }

    return { success: true, role: data as any }
}

/**
 * Update a role
 */
export async function updateRole(
    roleId: string,
    updates: { nome?: string; descricao?: string }
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin
        .from('roles')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', roleId)

    if (error) {
        console.error('Error updating role:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Delete a role
 */
export async function deleteRole(roleId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin
        .from('roles')
        .delete()
        .eq('id', roleId)

    if (error) {
        console.error('Error deleting role:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if user is admin in a faculdade
 */
export async function isAdmin(userId: string, faculdadeId: string): Promise<boolean> {
    const roles = await getUserRoles(userId, faculdadeId)
    return roles.some(role => role.nome === 'admin')
}

/**
 * Get all users with their roles in a faculdade
 */
export async function getUsersWithRoles(faculdadeId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
        .from('user_roles')
        .select(`
      user_id,
      usuarios (id, nome, email),
      roles (id, nome, descricao)
    `)
        .eq('faculdade_id', faculdadeId)

    if (error) {
        console.error('Error fetching users with roles:', error)
        return []
    }

    // Group by user
    const usersMap = new Map()

    data?.forEach((item: any) => {
        if (!usersMap.has(item.user_id)) {
            usersMap.set(item.user_id, {
                ...item.usuarios,
                roles: []
            })
        }
        usersMap.get(item.user_id).roles.push(item.roles)
    })

    return Array.from(usersMap.values())
}
