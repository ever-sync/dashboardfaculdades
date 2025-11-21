import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hasPermission } from '@/lib/rbac'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface AuthContext {
    userId: string
    faculdadeId: string
    user: any
}

/**
 * Middleware to check authentication and authorization
 */
export async function withAuth(
    request: NextRequest,
    requiredPermission?: string
): Promise<{ authorized: boolean; context?: AuthContext; response?: NextResponse }> {
    try {
        // Get authorization header
        const authHeader = request.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                authorized: false,
                response: NextResponse.json(
                    { error: 'Não autorizado. Token não fornecido.' },
                    { status: 401 }
                )
            }
        }

        const token = authHeader.substring(7)

        // Verify token with Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return {
                authorized: false,
                response: NextResponse.json(
                    { error: 'Token inválido ou expirado.' },
                    { status: 401 }
                )
            }
        }

        // Get faculdade_id from query params or body
        const { searchParams } = new URL(request.url)
        let faculdadeId = searchParams.get('faculdade_id')

        // If not in query params, try to get from body
        if (!faculdadeId && request.method !== 'GET') {
            try {
                const body = await request.json()
                faculdadeId = body.faculdade_id
            } catch {
                // Body might not be JSON or already consumed
            }
        }

        if (!faculdadeId) {
            return {
                authorized: false,
                response: NextResponse.json(
                    { error: 'faculdade_id é obrigatório.' },
                    { status: 400 }
                )
            }
        }

        // Check permission if required
        if (requiredPermission) {
            const hasRequiredPermission = await hasPermission(
                user.id,
                requiredPermission,
                faculdadeId
            )

            if (!hasRequiredPermission) {
                return {
                    authorized: false,
                    response: NextResponse.json(
                        { error: 'Você não tem permissão para realizar esta ação.' },
                        { status: 403 }
                    )
                }
            }
        }

        return {
            authorized: true,
            context: {
                userId: user.id,
                faculdadeId,
                user
            }
        }
    } catch (error) {
        console.error('Error in withAuth middleware:', error)
        return {
            authorized: false,
            response: NextResponse.json(
                { error: 'Erro ao verificar autenticação.' },
                { status: 500 }
            )
        }
    }
}

/**
 * Higher-order function to wrap API route handlers with authentication
 */
export function requireAuth(
    handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>,
    requiredPermission?: string
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        const { authorized, context, response } = await withAuth(request, requiredPermission)

        if (!authorized || !context) {
            return response!
        }

        return handler(request, context)
    }
}

/**
 * Check multiple permissions (user must have at least one)
 */
export async function withAnyPermission(
    request: NextRequest,
    permissions: string[]
): Promise<{ authorized: boolean; context?: AuthContext; response?: NextResponse }> {
    const { authorized, context, response } = await withAuth(request)

    if (!authorized || !context) {
        return { authorized: false, response }
    }

    // Check if user has any of the required permissions
    const permissionChecks = await Promise.all(
        permissions.map(perm => hasPermission(context.userId, perm, context.faculdadeId))
    )

    const hasAnyPermission = permissionChecks.some(result => result === true)

    if (!hasAnyPermission) {
        return {
            authorized: false,
            response: NextResponse.json(
                { error: 'Você não tem permissão para realizar esta ação.' },
                { status: 403 }
            )
        }
    }

    return { authorized: true, context }
}

/**
 * Higher-order function requiring any of the specified permissions
 */
export function requireAnyPermission(
    handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>,
    permissions: string[]
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        const { authorized, context, response } = await withAnyPermission(request, permissions)

        if (!authorized || !context) {
            return response!
        }

        return handler(request, context)
    }
}
