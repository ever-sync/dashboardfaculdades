'use client'

import { Bell, Search, User, MessageSquare, Send, Clock, Users, Ban, Tag, Settings, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import FaculdadeSelector from './FaculdadeSelector'

interface HeaderProps {
  title: string
  subtitle?: string
}

// Submenu de Conversas
const conversasSubmenu = [
  { icon: Send, label: 'Disparo em Massa', href: '/dashboard/disparo-massa', color: 'text-violet-500' },
  { icon: Clock, label: 'Filas', href: '/dashboard/filas', color: 'text-orange-500' },
  { icon: Users, label: 'Atendentes', href: '/dashboard/atendentes', color: 'text-blue-500' },
  { icon: Ban, label: 'Bloqueados', href: '/dashboard/conversas/bloqueados', color: 'text-red-500' },
  { icon: Tag, label: 'Etiquetas', href: '/dashboard/conversas/etiquetas', color: 'text-teal-500' },
  { icon: Settings, label: 'Ajustes', href: '/dashboard/conversas/ajustes', color: 'text-gray-500' },
]

export function Header({ title, subtitle }: HeaderProps) {
  const pathname = usePathname()
  const [conversasDropdownOpen, setConversasDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setConversasDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Verificar se alguma página do submenu está ativa
  const isConversasActive = pathname === '/dashboard/conversas' || conversasSubmenu.some(item => pathname === item.href)

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <FaculdadeSelector />
          
          {/* Botão Conversas com Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setConversasDropdownOpen(!conversasDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isConversasActive
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium hidden sm:inline">Conversas</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${conversasDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {conversasDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                {conversasSubmenu.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setConversasDropdownOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : item.color}`} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-black truncate">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Notifications */}
          <button className="relative p-2 text-black hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* User */}
          <button className="flex items-center gap-2 p-2 text-black hover:bg-gray-100 rounded-lg transition-colors">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-400 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
            </div>
          </button>
          
          {/* Search - Por último para não quebrar o layout */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent text-black placeholder-gray-400 w-32 sm:w-40 lg:w-64"
            />
          </div>
        </div>
      </div>
    </div>
  )
}