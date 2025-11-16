import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('sb-access-token')?.value
    
    // Se houver token, fazer logout no Supabase
    if (accessToken) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      await supabase.auth.signOut()
    }
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logout realizado com sucesso' 
    })
    
    // Limpar todos os cookies de autenticação
    response.cookies.set('user', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
    })
    
    response.cookies.set('sb-access-token', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
    })
    
    response.cookies.set('sb-refresh-token', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
    })
    
    return response
  } catch (error) {
    console.error('Erro no logout:', error)
    return NextResponse.json(
      { error: 'Erro ao realizar logout' },
      { status: 500 }
    )
  }
}