import { NextRequest, NextResponse } from 'next/server'
import { getUserPermissions } from '@/lib/rbac'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabase = supabaseAdmin

// GET /api/rbac/user-permissions - Get current user's permissions
export async function GET(request: NextRequest) {
    try {
        // Get authorization header
        const authHeader = request.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)

        // Verify token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Token inválido' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const faculdadeId = searchParams.get('faculdade_id')

        if (!faculdadeId) {
            return NextResponse.json(
                { error: 'faculdade_id é obrigatório' },
                { status: 400 }
            )
        }

        // Get user permissions
        const permissions = await getUserPermissions(user.id, faculdadeId)

        return NextResponse.json({ permissions })
    } catch (error) {
        console.error('Error fetching user permissions:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar permissões' },
            { status: 500 }
        )
    }
}
