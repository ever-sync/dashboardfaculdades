import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Verificar se está tentando acessar rotas do dashboard
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const userCookie = request.cookies.get('user')
  const accessToken = request.cookies.get('sb-access-token')
  
  // Verificar autenticação - aceitar qualquer um dos cookies
  const isAuthenticated = !!(userCookie || accessToken)
  
  // Se tentar acessar dashboard sem estar logado, redirecionar para login
  if (isDashboard && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    // Adicionar redirect após login
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Se estiver logado e tentar acessar login, redirecionar para dashboard
  if (request.nextUrl.pathname === '/login' && isAuthenticated) {
    const redirect = request.nextUrl.searchParams.get('redirect')
    return NextResponse.redirect(new URL(redirect || '/dashboard', request.url))
  }
  
  // Adicionar headers de segurança
  const response = NextResponse.next()
  
  // Headers de segurança básicos
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // CSP básico - ajustar conforme necessário
  // Permitir fontes do Google (http e https em ambiente local), Adobe Typekit e fontes locais do Next.js
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://use.typekit.net; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com http://fonts.googleapis.com https://use.typekit.net; " +
      "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com http://fonts.googleapis.com https://use.typekit.net; " +
      "font-src 'self' data: https://fonts.gstatic.com http://fonts.gstatic.com https://use.typekit.net http://192.168.0.171:3000 https://192.168.0.171:3000; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https: http://192.168.0.171:3000 https://192.168.0.171:3000 https://use.typekit.net;"
  )
  
  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login'
  ]
}