import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { ConversaWhatsApp } from '@/types/supabase'

interface UseConversasOptions {
  faculdadeId: string | null
  page?: number
  pageSize?: number
  statusFilter?: ConversaWhatsApp['status']
  departamentoFilter?: string
  searchTerm?: string
}

interface UseConversasReturn {
  conversas: ConversaWhatsApp[]
  loading: boolean
  error: string | null
  totalCount: number
  totalPages: number
  currentPage: number
  refetch: () => Promise<void>
}

export function useConversas({
  faculdadeId,
  page = 1,
  pageSize = 20,
  statusFilter,
  departamentoFilter,
  searchTerm,
}: UseConversasOptions): UseConversasReturn {
  const [conversas, setConversas] = useState<ConversaWhatsApp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchConversas = useCallback(async () => {
    if (!faculdadeId) {
      setConversas([])
      setLoading(false)
      setTotalCount(0)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Construir query base
      let query = supabase
        .from('conversas_whatsapp')
        .select('*', { count: 'exact' })
        .eq('faculdade_id', faculdadeId)

      // Aplicar filtros
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      if (departamentoFilter) {
        query = query.eq('departamento', departamentoFilter)
      }

      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%`)
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
        .order('data_ultima_mensagem', { ascending: false })
        .range(startIndex, endIndex)

      if (dataError) throw dataError

      setConversas(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar conversas:', err)
      setError(err.message || 'Erro ao carregar conversas')
      setConversas([])
    } finally {
      setLoading(false)
    }
  }, [faculdadeId, page, pageSize, statusFilter, departamentoFilter, searchTerm])

  useEffect(() => {
    fetchConversas()
  }, [fetchConversas])

  const totalPages = Math.ceil(totalCount / pageSize)

  return {
    conversas,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage: page,
    refetch: fetchConversas,
  }
}

