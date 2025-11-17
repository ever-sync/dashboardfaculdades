import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Prospect } from '@/types/supabase'

interface UseProspectsOptions {
  faculdadeId: string | null
  page?: number
  pageSize?: number
  statusFilter?: Prospect['status_academico']
  cursoFilter?: string
  searchTerm?: string
}

interface UseProspectsReturn {
  prospects: Prospect[]
  loading: boolean
  error: string | null
  totalCount: number
  totalPages: number
  currentPage: number
  refetch: () => Promise<void>
}

export function useProspects({
  faculdadeId,
  page = 1,
  pageSize = 20,
  statusFilter,
  cursoFilter,
  searchTerm,
}: UseProspectsOptions): UseProspectsReturn {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchProspects = useCallback(async () => {
    if (!faculdadeId) {
      setProspects([])
      setLoading(false)
      setTotalCount(0)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Construir query base
      let query = supabase
        .from('prospects_academicos')
        .select('*', { count: 'exact' })
        .eq('faculdade_id', faculdadeId)

      // Aplicar filtros
      if (statusFilter) {
        query = query.eq('status_academico', statusFilter)
      }

      if (cursoFilter) {
        query = query.ilike('curso', `%${cursoFilter}%`)
      }

      if (searchTerm) {
        query = query.or(
          `nome.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        )
      }

      // Buscar contagem total primeiro
      const { count, error: countError } = await query

      if (countError) throw countError

      setTotalCount(count || 0)

      // Calcular paginação
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize - 1

      // Buscar dados paginados
      const { data, error: dataError } = await query
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex)

      if (dataError) throw dataError

      setProspects(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar prospects:', err)
      setError(err.message || 'Erro ao carregar prospects')
      setProspects([])
    } finally {
      setLoading(false)
    }
  }, [faculdadeId, page, pageSize, statusFilter, cursoFilter, searchTerm])

  useEffect(() => {
    fetchProspects()
  }, [fetchProspects])

  const totalPages = Math.ceil(totalCount / pageSize)

  return {
    prospects,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage: page,
    refetch: fetchProspects,
  }
}

