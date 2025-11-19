'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  MessageSquare,
  TrendingUp,
  Building2,
  Menu,
  X,
  Bot,
  GraduationCap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Briefcase
} from 'lucide-react'

// Itens do menu principal (exceto Dashboard, Conversas e CRM que são renderizados separadamente)
const menuItems = [
  { icon: Users, label: 'Alunos', href: '/dashboard/prospects', color: 'text-green-500' },
  { icon: GraduationCap, label: 'Cursos', href: '/dashboard/cursos', color: 'text-emerald-500' },
  { icon: Bot, label: 'Agentes IA', href: '/dashboard/agentes-ia', color: 'text-cyan-500' },
  { icon: BookOpen, label: 'Conhecimento', href: '/dashboard/base-conhecimentos', color: 'text-teal-500' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', color: 'text-purple-500' },
  { icon: TrendingUp, label: 'Relatórios', href: '/dashboard/relatorios', color: 'text-orange-500' },
  { icon: Building2, label: 'Faculdades', href: '/dashboard/faculdades', color: 'text-pink-500' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true')
    }
  }, [])
  
  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', String(newState))
  }
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isMobileMenuOpen && !target.closest('.mobile-sidebar')) {
        setIsMobileMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileMenuOpen])
  
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }
  
  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-black text-white shadow-lg border border-gray-200"
        aria-label="Abrir menu"
        aria-expanded={isMobileMenuOpen}
        aria-controls="mobile-sidebar"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-40" />
      )}
      
      {/* Sidebar */}
      <div
        id="mobile-sidebar"
        className={`mobile-sidebar fixed lg:relative inset-y-0 left-0 z-40 bg-white border-r border-gray-200 h-screen flex flex-col transform transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'lg:w-16' : 'lg:w-64'
        }`}
      >
        {/* Logo e Botão de Colapsar */}
        <div className={`p-6 pt-16 lg:pt-6 border-b border-gray-200 flex-shrink-0 ${isCollapsed ? 'lg:px-3 lg:py-4' : ''}`}>
          {!isCollapsed ? (
            <div className="relative">
              <h1 className="text-2xl font-bold text-black pr-8">Edu.Zap</h1>
              <p className="text-sm text-gray-600">Dashboard Acadêmico</p>
              {/* Botão de Colapsar (apenas desktop) */}
              <button
                onClick={toggleCollapse}
                className="hidden lg:flex absolute top-0 right-0 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900 z-10"
                aria-label="Colapsar menu"
                title="Colapsar menu"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="lg:flex flex-col items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              {/* Botão de Expandir (apenas desktop) */}
              <button
                onClick={toggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
                aria-label="Expandir menu"
                title="Expandir menu"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        {/* Menu - Scrollável */}
        <nav className="flex-1 px-4 space-y-1 py-4 overflow-y-auto" role="navigation" aria-label="Menu principal">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            aria-current={pathname === '/dashboard' ? 'page' : undefined}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              pathname === '/dashboard'
                ? 'bg-black text-white'
                : 'text-black hover:bg-gray-100'
            } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
            title={isCollapsed ? 'Dashboard' : undefined}
          >
            <LayoutDashboard className={`w-5 h-5 ${pathname === '/dashboard' ? '' : 'text-gray-500'} flex-shrink-0`} aria-hidden="true" />
            {!isCollapsed && <span className="font-medium">Dashboard</span>}
          </Link>

          {/* Conversas - Link simples sem dropdown */}
          <Link
            href="/dashboard/conversas"
            aria-current={pathname === '/dashboard/conversas' || 
              pathname.startsWith('/dashboard/disparo-massa') ||
              pathname.startsWith('/dashboard/filas') ||
              pathname.startsWith('/dashboard/atendentes') ||
              pathname.startsWith('/dashboard/conversas/bloqueados') ||
              pathname.startsWith('/dashboard/conversas/etiquetas') ||
              pathname.startsWith('/dashboard/conversas/ajustes')
              ? 'page' : undefined}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              pathname === '/dashboard/conversas' || 
              pathname.startsWith('/dashboard/disparo-massa') ||
              pathname.startsWith('/dashboard/filas') ||
              pathname.startsWith('/dashboard/atendentes') ||
              pathname.startsWith('/dashboard/conversas/bloqueados') ||
              pathname.startsWith('/dashboard/conversas/etiquetas') ||
              pathname.startsWith('/dashboard/conversas/ajustes')
                ? 'bg-black text-white'
                : 'text-black hover:bg-gray-100'
            } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
            title={isCollapsed ? 'Conversas' : undefined}
          >
            <MessageSquare className={`w-5 h-5 ${
              pathname === '/dashboard/conversas' || 
              pathname.startsWith('/dashboard/disparo-massa') ||
              pathname.startsWith('/dashboard/filas') ||
              pathname.startsWith('/dashboard/atendentes') ||
              pathname.startsWith('/dashboard/conversas/bloqueados') ||
              pathname.startsWith('/dashboard/conversas/etiquetas') ||
              pathname.startsWith('/dashboard/conversas/ajustes')
                ? ''
                : 'text-indigo-500'
            } flex-shrink-0`} aria-hidden="true" />
            {!isCollapsed && <span className="font-medium">Conversas</span>}
          </Link>

          {/* CRM */}
          <Link
            href="/dashboard/crm"
            aria-current={pathname === '/dashboard/crm' ? 'page' : undefined}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              pathname === '/dashboard/crm'
                ? 'bg-black text-white'
                : 'text-black hover:bg-gray-100'
            } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
            title={isCollapsed ? 'CRM' : undefined}
          >
            <Briefcase className={`w-5 h-5 ${pathname === '/dashboard/crm' ? '' : 'text-teal-500'} flex-shrink-0`} aria-hidden="true" />
            {!isCollapsed && <span className="font-medium">CRM</span>}
          </Link>

          {/* Outros itens do menu */}
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-black hover:bg-gray-100'
                } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 ${isActive ? '' : item.color} flex-shrink-0`} aria-hidden="true" />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>
        
        {/* Configuração e Logout - Fixo na parte inferior */}
        <div className="p-4 border-t border-gray-200 space-y-2 flex-shrink-0 bg-white">
          <Link
            href="/dashboard/configuracoes"
            aria-current={pathname === '/dashboard/configuracoes' ? 'page' : undefined}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              pathname === '/dashboard/configuracoes'
                ? 'bg-black text-white'
                : 'text-black hover:bg-gray-100'
            } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
            title={isCollapsed ? 'Configuração' : undefined}
          >
            <Settings className={`w-5 h-5 ${pathname === '/dashboard/configuracoes' ? '' : 'text-gray-600'} flex-shrink-0`} aria-hidden="true" />
            {!isCollapsed && <span className="font-medium">Configuração</span>}
          </Link>
          
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-black hover:bg-gray-100 transition-colors ${
              isCollapsed ? 'lg:justify-center lg:px-2' : ''
            }`}
            aria-label="Sair do dashboard"
            title={isCollapsed ? 'Sair' : undefined}
          >
            <LogOut className="w-5 h-5 text-red-500 flex-shrink-0" aria-hidden="true" />
            {!isCollapsed && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </div>
    </>
  )
}