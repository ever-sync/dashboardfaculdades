import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Criar cliente Supabase para autenticação
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
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
        { error: authError?.message || 'Credenciais inválidas' },
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
    
    // Salvar token de sessão em cookie
    const isProduction = process.env.NODE_ENV === 'production'
    
    if (authData.session) {
      response.cookies.set('sb-access-token', authData.session.access_token, {
        httpOnly: true,
        secure: isProduction, // HTTPS em produção
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: '/',
      })
      
      response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
        httpOnly: true,
        secure: isProduction, // HTTPS em produção
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: '/',
      })
    }
    
    // Manter cookie de usuário para compatibilidade
    response.cookies.set('user', JSON.stringify(user), {
      httpOnly: true,
      secure: isProduction, // HTTPS em produção
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    })
    
    return response
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}