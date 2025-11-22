import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/middleware/withAuth'
import {

// Force dynamic rendering
export const dynamic = 'force-dynamic'
    assignRole,
    removeRole,
    assignPermissionToRole,
    removePermissionFromRole,
    getUserRoles,
    getUsersWithRoles
} from '@/lib/rbac'

// GET /api/rbac/assign - Get user roles or all users with roles
export const GET = requireAuth(async (request: NextRequest, context) => {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('user_id')
        const faculdadeId = searchParams.get('faculdade_id') || context.faculdadeId

        if (userId) {
            // Get roles for specific user
            const roles = await getUserRoles(userId, faculdadeId)
            return NextResponse.json({ roles })
        }

        // Get all users with their roles in the faculdade
        const users = await getUsersWithRoles(faculdadeId)
        return NextResponse.json({ users })
    } catch (error) {
        console.error('Error fetching user roles:', error)
        return NextResponse.json(
            { error: 'Error fetching user roles' },
            { status: 500 }
        )
    }
}, 'usuarios.manage')

// POST /api/rbac/assign - Assign role to user or permission to role
export const POST = requireAuth(async (request: NextRequest, context) => {
    try {
        const body = await request.json()
        const { type, user_id, role_id, permission_id, faculdade_id } = body

        if (type === 'user_role') {
            // Assign role to user
            if (!user_id || !role_id || !faculdade_id) {
                return NextResponse.json(
                    { error: 'user_id, role_id, and faculdade_id are required' },
                    { status: 400 }
                )
            }

            const result = await assignRole(user_id, role_id, faculdade_id)

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error || 'Error assigning role' },
                    { status: 400 }
                )
            }

            return NextResponse.json({ success: true })
        } else if (type === 'role_permission') {
            // Assign permission to role
            if (!role_id || !permission_id) {
                return NextResponse.json(
                    { error: 'role_id and permission_id are required' },
                    { status: 400 }
                )
            }

            const result = await assignPermissionToRole(role_id, permission_id)

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error || 'Error assigning permission' },
                    { status: 400 }
                )
            }

            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json(
                { error: 'Invalid type. Must be "user_role" or "role_permission"' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Error in assign:', error)
        return NextResponse.json(
            { error: 'Error processing assignment' },
            { status: 500 }
        )
    }
}, 'usuarios.manage')

// DELETE /api/rbac/assign - Remove role from user or permission from role
export const DELETE = requireAuth(async (request: NextRequest, context) => {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const userId = searchParams.get('user_id')
        const roleId = searchParams.get('role_id')
        const permissionId = searchParams.get('permission_id')
        const faculdadeId = searchParams.get('faculdade_id') || context.faculdadeId

        if (type === 'user_role') {
            // Remove role from user
            if (!userId || !roleId || !faculdadeId) {
                return NextResponse.json(
                    { error: 'user_id, role_id, and faculdade_id are required' },
                    { status: 400 }
                )
            }

            const result = await removeRole(userId, roleId, faculdadeId)

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error || 'Error removing role' },
                    { status: 400 }
                )
            }

            return NextResponse.json({ success: true })
        } else if (type === 'role_permission') {
            // Remove permission from role
            if (!roleId || !permissionId) {
                return NextResponse.json(
                    { error: 'role_id and permission_id are required' },
                    { status: 400 }
                )
            }

            const result = await removePermissionFromRole(roleId, permissionId)

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error || 'Error removing permission' },
                    { status: 400 }
                )
            }

            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json(
                { error: 'Invalid type. Must be "user_role" or "role_permission"' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Error in remove:', error)
        return NextResponse.json(
            { error: 'Error processing removal' },
            { status: 500 }
        )
    }
}, 'usuarios.manage')
