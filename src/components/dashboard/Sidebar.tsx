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
  X
} from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', color: 'text-blue-500' },
  { icon: Users, label: 'Prospects', href: '/dashboard/prospects', color: 'text-green-500' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', color: 'text-purple-500' },
  { icon: MessageSquare, label: 'Conversas', href: '/dashboard/conversas', color: 'text-indigo-500' },
  { icon: TrendingUp, label: 'Relatórios', href: '/dashboard/relatorios', color: 'text-orange-500' },
  { icon: Building2, label: 'Faculdades', href: '/dashboard/faculdades', color: 'text-pink-500' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-black dark:bg-white text-white dark:text-black shadow-lg border border-gray-200 dark:border-gray-800"
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
        className={`mobile-sidebar fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 min-h-screen flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 pt-16 lg:pt-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-black dark:text-white">WhatsApp</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Analytics Dashboard</p>
        </div>
        
        {/* Menu */}
        <nav className="flex-1 px-4 space-y-1 py-4" role="navigation" aria-label="Menu principal">
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
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? '' : item.color}`} aria-hidden="true" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        
        {/* Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            aria-label="Sair do dashboard"
          >
            <LogOut className="w-5 h-5 text-red-500" aria-hidden="true" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </>
  )
}