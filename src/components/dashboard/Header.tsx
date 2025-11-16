'use client'

import { Bell, Search, User } from 'lucide-react'
import FaculdadeSelector from './FaculdadeSelector'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <FaculdadeSelector />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-black truncate">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search - Hidden on very small screens */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-400 w-32 sm:w-40 lg:w-64"
            />
          </div>
          
          {/* Notifications */}
          <button className="relative p-2 text-black hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* User */}
          <button className="flex items-center gap-2 p-2 text-black hover:bg-gray-100 rounded-lg transition-colors">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}