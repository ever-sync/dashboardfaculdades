import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/middleware/withAuth'
import { getAllPermissions, getPermissionsByResource } from '@/lib/rbac'

// GET /api/rbac/permissions - List all permissions
export const GET = requireAuth(async (request: NextRequest, context) => {
    try {
        const { searchParams } = new URL(request.url)
        const recurso = searchParams.get('recurso')

        if (recurso) {
            // Get permissions for specific resource
            const permissions = await getPermissionsByResource(recurso)
            return NextResponse.json({ permissions })
        }

        // Get all permissions
        const permissions = await getAllPermissions()

        // Group by resource for easier UI consumption
        const groupedPermissions = permissions.reduce((acc, perm) => {
            if (!acc[perm.recurso]) {
                acc[perm.recurso] = []
            }
            acc[perm.recurso].push(perm)
            return acc
        }, {} as Record<string, typeof permissions>)

        return NextResponse.json({
            permissions,
            grouped: groupedPermissions
        })
    } catch (error) {
        console.error('Error fetching permissions:', error)
        return NextResponse.json(
            { error: 'Error fetching permissions' },
            { status: 500 }
        )
    }
}, 'usuarios.manage')
