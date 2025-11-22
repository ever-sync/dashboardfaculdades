import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserPermissions, getUserRole } from '@/lib/authorization'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            // Verificar cookie de usuário demo
            const demoUserCookie = request.cookies.get('user')

            if (demoUserCookie) {
                try {
                    const demoUser = JSON.parse(demoUserCookie.value)

                    // Retornar permissões de admin para usuário demo
                    return NextResponse.json({
                        user: demoUser,
                        role: 'admin',
                        permissions: [] // Admin tem todas as permissões implicitamente
                    })
                } catch {
                    return NextResponse.json(
                        { error: 'Não autenticado' },
                        { status: 401 }
                    )
                }
            }

            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            )
        }

        // Buscar dados do usuário na tabela usuarios
        const { data: usuario, error: userError } = await supabase
            .from('usuarios')
            .select('id, nome, email, role, faculdade_id')
            .eq('email', user.email)
            .single()

        if (userError || !usuario) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        // Buscar permissões do usuário
        const permissions = await getUserPermissions(usuario.id)
        const role = await getUserRole(usuario.id)

        return NextResponse.json({
            user: {
                id: usuario.id,
                email: usuario.email,
                name: usuario.nome,
                faculdade_id: usuario.faculdade_id
            },
            role,
            permissions
        })
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
