import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { loginSchema, validateData } from '@/lib/apiValidation'
import { getUserFriendlyError } from '@/lib/errorMessages'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const body = await request.json()

    // Validar dados de entrada
    const validation = validateData(loginSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Store cookies temporarily
    const cookieStore: { name: string, value: string, options: CookieOptions }[] = []

    // Criar cliente Supabase para autenticação
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.push({ name, value, options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.push({ name, value: '', options: { ...options, maxAge: 0 } })
          },
        },
      }
    )

    // Tentar fazer login com Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      // Fallback para credenciais demo (funciona em dev e produção para facilitar testes)
      if (email === 'admin@unifatecie.com.br' && password === 'admin123') {
        const user = { id: 'demo-user', email, name: 'Admin Demo' }
        const response = NextResponse.json({ success: true, user })

        // Configurar cookie para funcionar em produção
        const isProduction = process.env.NODE_ENV === 'production'
        response.cookies.set('user', JSON.stringify(user), {
          httpOnly: true,
          secure: isProduction, // HTTPS em produção
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 dias
          path: '/',
        })
        return response
      }

      return NextResponse.json(
        { error: getUserFriendlyError(authError || 'Credenciais inválidas') },
        { status: 401 }
      )
    }

    // Login bem-sucedido
    const user = {
      id: authData.user.id,
      email: authData.user.email!,
      name: authData.user.user_metadata?.name || authData.user.email!.split('@')[0],
    }

    const response = NextResponse.json({ success: true, user })

    // Aplicar cookies do Supabase
    cookieStore.forEach(({ name, value, options }) => {
      response.cookies.set({ name, value, ...options })
    })

    // Manter cookie de usuário para compatibilidade
    const isProduction = process.env.NODE_ENV === 'production'
    response.cookies.set('user', JSON.stringify(user), {
      httpOnly: true,
      secure: isProduction, // HTTPS em produção
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    })

    return response
  } catch (error) {
    // Log erro em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro no login:', error)
    }

    return NextResponse.json(
      { error: getUserFriendlyError(error) },
      { status: 500 }
    )
  }
}