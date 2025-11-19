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
      
      const faculdadesData = data || []
      setFaculdades(faculdadesData)
      
      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('Faculdades carregadas:', {
          total: faculdadesData.length,
          faculdades: faculdadesData.map((f: Faculdade) => ({
            id: f.id,
            nome: f.nome,
            tem_id: !!f.id,
            tipo_id: typeof f.id
          }))
        })
      }
      
      if (faculdadesData.length > 0 && !faculdadeSelecionada) {
        // Selecionar a primeira faculdade que tenha ID válido
        const faculdadeValida = faculdadesData.find((f: Faculdade) => f.id && typeof f.id === 'string')
        if (faculdadeValida) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Faculdade selecionada:', {
              id: faculdadeValida.id,
              nome: faculdadeValida.nome
            })
          }
          setFaculdadeSelecionada(faculdadeValida)
        } else {
          console.warn('Nenhuma faculdade com ID válido encontrada. Faculdades:', faculdadesData)
        }
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