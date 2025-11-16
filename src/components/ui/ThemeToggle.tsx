'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Durante SSR ou antes da hidratação, mostrar botão desabilitado
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800"
        aria-label="Alternar tema"
        disabled
      >
        <Moon className="w-5 h-5 text-gray-400" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      aria-label={`Alternar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-700" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-500" />
      )}
    </button>
  )
}

