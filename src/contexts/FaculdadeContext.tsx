'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Faculdade } from '@/types/supabase'

interface FaculdadeContextType {
  faculdadeSelecionada: Faculdade | null
  faculdades: Faculdade[]
  setFaculdadeSelecionada: (faculdade: Faculdade) => void
  loading: boolean
}

const FaculdadeContext = createContext<FaculdadeContextType | undefined>(undefined)

export function FaculdadeProvider({ children }: { children: React.ReactNode }) {
  const [faculdades, setFaculdades] = useState<Faculdade[]>([])
  const [faculdadeSelecionada, setFaculdadeSelecionada] = useState<Faculdade | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    try {
      const { data, error } = await supabase
        .from('faculdades')
        .select('*')
        .eq('status', 'ativo')
        .order('nome')
      
      if (error) throw error
      
      setFaculdades(data || [])
      if (data && data.length > 0 && !faculdadeSelecionada) {
        setFaculdadeSelecionada(data[0])
      }
    } catch (error) {
      console.error('Erro ao carregar faculdades:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <FaculdadeContext.Provider value={{ faculdadeSelecionada, faculdades, setFaculdadeSelecionada, loading }}>
      {children}
    </FaculdadeContext.Provider>
  )
}

export function useFaculdade() {
  const ctx = useContext(FaculdadeContext)
  return (
    ctx || {
      faculdadeSelecionada: null,
      faculdades: [],
      setFaculdadeSelecionada: () => {},
      loading: false,
    }
  )
}