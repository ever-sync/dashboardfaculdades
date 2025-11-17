import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MetricaDiaria, MetricaPorHorario, MetricaPorSetor, MetricaDemografica } from '@/types/supabase'

interface UseMetricasOptions {
  faculdadeId: string | null
  periodo?: '7d' | '30d' | '90d'
  departamento?: string
}

interface UseMetricasReturn {
  metricas: MetricaDiaria[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useMetricas({
  faculdadeId,
  periodo = '30d',
  departamento,
}: UseMetricasOptions): UseMetricasReturn {
  const [metricas, setMetricas] = useState<MetricaDiaria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetricas = useCallback(async () => {
    if (!faculdadeId) {
      setMetricas([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Calcular data inicial baseada no período
      const dias = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - dias)

      // Construir query
      let query = supabase
        .from('metricas_diarias')
        .select('*')
        .eq('faculdade_id', faculdadeId)
        .gte('data', dataInicio.toISOString().split('T')[0])

      // Filtrar por departamento se fornecido
      if (departamento) {
        query = query.eq('departamento', departamento)
      }

      const { data, error: dataError } = await query.order('data', { ascending: false })

      if (dataError) throw dataError

      setMetricas(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar métricas:', err)
      setError(err.message || 'Erro ao carregar métricas')
      setMetricas([])
    } finally {
      setLoading(false)
    }
  }, [faculdadeId, periodo, departamento])

  useEffect(() => {
    fetchMetricas()
  }, [fetchMetricas])

  return {
    metricas,
    loading,
    error,
    refetch: fetchMetricas,
  }
}

// Hook específico para métricas por horário
export function useMetricasPorHorario({
  faculdadeId,
  data,
}: {
  faculdadeId: string | null
  data: string
}) {
  const [metricas, setMetricas] = useState<MetricaPorHorario[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMetricas = useCallback(async () => {
    if (!faculdadeId || !data) {
      setMetricas([])
      setLoading(false)
      return
    }

    try {
      const { data: result, error } = await supabase
        .from('metricas_por_horario')
        .select('*')
        .eq('faculdade_id', faculdadeId)
        .eq('data', data)
        .order('hora', { ascending: true })

      if (error) throw error
      setMetricas(result || [])
    } catch (err) {
      console.error('Erro ao buscar métricas por horário:', err)
      setMetricas([])
    } finally {
      setLoading(false)
    }
  }, [faculdadeId, data])

  useEffect(() => {
    fetchMetricas()
  }, [fetchMetricas])

  return { metricas, loading, refetch: fetchMetricas }
}

// Hook específico para métricas por setor
export function useMetricasPorSetor({
  faculdadeId,
  periodo = '30d',
}: {
  faculdadeId: string | null
  periodo?: '7d' | '30d' | '90d'
}) {
  const [metricas, setMetricas] = useState<MetricaPorSetor[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMetricas = useCallback(async () => {
    if (!faculdadeId) {
      setMetricas([])
      setLoading(false)
      return
    }

    try {
      const dias = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - dias)

      const { data: result, error } = await supabase
        .from('metricas_por_setor')
        .select('*')
        .eq('faculdade_id', faculdadeId)
        .gte('data', dataInicio.toISOString().split('T')[0])
        .order('data', { ascending: false })

      if (error) throw error
      setMetricas(result || [])
    } catch (err) {
      console.error('Erro ao buscar métricas por setor:', err)
      setMetricas([])
    } finally {
      setLoading(false)
    }
  }, [faculdadeId, periodo])

  useEffect(() => {
    fetchMetricas()
  }, [fetchMetricas])

  return { metricas, loading, refetch: fetchMetricas }
}

