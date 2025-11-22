import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/middleware/withAuth'
import {
    getAllRoles,
    getRoleWithPermissions,
    createRole,
    updateRole,
    deleteRole
} from '@/lib/rbac'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET /api/rbac/roles - List all roles
export const GET = requireAuth(async (request: NextRequest, context) => {
    try {
        const { searchParams } = new URL(request.url)
        const roleId = searchParams.get('role_id')

        if (roleId) {
            // Get specific role with permissions
            const role = await getRoleWithPermissions(roleId)

            if (!role) {
                return NextResponse.json(
                    { error: 'Role not found' },
                    { status: 404 }
                )
            }

            return NextResponse.json({ role })
        }

        // Get all roles
        const roles = await getAllRoles()
        return NextResponse.json({ roles })
    } catch (error) {
        console.error('Error fetching roles:', error)
        return NextResponse.json(
            { error: 'Error fetching roles' },
            { status: 500 }
        )
    }
}, 'usuarios.manage')

// POST /api/rbac/roles - Create a new role
export const POST = requireAuth(async (request: NextRequest, context) => {
    try {
        const body = await request.json()
        const { nome, descricao } = body

        if (!nome) {
            return NextResponse.json(
                { error: 'Nome is required' },
                { status: 400 }
            )
        }

        const result = await createRole(nome, descricao)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Error creating role' },
                { status: 400 }
            )
        }

        return NextResponse.json({ role: result.role }, { status: 201 })
    } catch (error) {
        console.error('Error creating role:', error)
        return NextResponse.json(
            { error: 'Error creating role' },
            { status: 500 }
        )
    }
}, 'usuarios.manage')

// PUT /api/rbac/roles - Update a role
export const PUT = requireAuth(async (request: NextRequest, context) => {
    try {
        const body = await request.json()
        const { role_id, nome, descricao } = body

        if (!role_id) {
            return NextResponse.json(
                { error: 'role_id is required' },
                { status: 400 }
            )
        }

        const updates: any = {}
        if (nome !== undefined) updates.nome = nome
        if (descricao !== undefined) updates.descricao = descricao

        const result = await updateRole(role_id, updates)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Error updating role' },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating role:', error)
        return NextResponse.json(
            { error: 'Error updating role' },
            { status: 500 }
        )
    }
}, 'usuarios.manage')

// DELETE /api/rbac/roles - Delete a role
export const DELETE = requireAuth(async (request: NextRequest, context) => {
    try {
        const { searchParams } = new URL(request.url)
        const roleId = searchParams.get('role_id')

        if (!roleId) {
            return NextResponse.json(
                { error: 'role_id is required' },
                { status: 400 }
            )
        }

        const result = await deleteRole(roleId)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Error deleting role' },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting role:', error)
        return NextResponse.json(
            { error: 'Error deleting role' },
            { status: 500 }
        )
    }
}, 'usuarios.manage')
