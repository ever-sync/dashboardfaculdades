'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name?: string
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Tentar obter usuário do cookie
    const getUserFromCookie = () => {
      try {
        const cookies = document.cookie.split(';')
        const userCookie = cookies.find(c => c.trim().startsWith('user='))
        
        if (userCookie) {
          const userData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]))
          return userData
        }
      } catch (error) {
        console.error('Erro ao ler cookie de usuário:', error)
      }
      
      // Fallback: tentar obter do localStorage ou sessionStorage
      try {
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
        if (storedUser) {
          return JSON.parse(storedUser)
        }
      } catch (error) {
        console.error('Erro ao ler usuário do storage:', error)
      }
      
      return null
    }

    const userData = getUserFromCookie()
    setUser(userData)
    setLoading(false)
  }, [])

  const getUserName = () => {
    if (!user) return 'Admin'
    return user.name || user.email?.split('@')[0] || 'Admin'
  }

  return {
    user,
    loading,
    getUserName,
    isAuthenticated: !!user
  }
}

