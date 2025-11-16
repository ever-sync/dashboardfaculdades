import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Verificar se está tentando acessar rotas do dashboard
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const userCookie = request.cookies.get('user')
  
  // Se tentar acessar dashboard sem estar logado, redirecionar para login
  if (isDashboard && !userCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Se estiver logado e tentar acessar login, redirecionar para dashboard
  if (request.nextUrl.pathname === '/login' && userCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Adicionar headers de segurança
  const response = NextResponse.next()
  
  // Headers de segurança básicos
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // CSP básico - ajustar conforme necessário
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  )
  
  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login'
  ]
}