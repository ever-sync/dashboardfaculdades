import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Mensagem } from '@/types/supabase'

interface UseMensagensOptions {
  conversaId: string | null
}

interface UseMensagensReturn {
  mensagens: Mensagem[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  sendMessage: (conteudo: string, remetente: 'usuario' | 'agente' | 'bot') => Promise<void>
}

export function useMensagens({ conversaId }: UseMensagensOptions): UseMensagensReturn {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMensagens = useCallback(async () => {
    if (!conversaId) {
      setMensagens([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Tentar buscar mensagens ordenando por timestamp
      let { data, error: dataError } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('timestamp', { ascending: true })

      // Se falhar, tentar sem order primeiro para verificar se a tabela existe
      if (dataError) {
        console.warn('Erro ao buscar mensagens com order:', {
          message: dataError.message,
          details: dataError.details,
          hint: dataError.hint,
          code: dataError.code
        })

        // Tentar sem order
        const resultSimple = await supabase
          .from('mensagens')
          .select('*')
          .eq('conversa_id', conversaId)

        if (resultSimple.error) {
          // Se ainda falhar, tentar com created_at
          if (resultSimple.error.message?.includes('timestamp') || resultSimple.error.code === '42883') {
            console.warn('Tentando com created_at:', resultSimple.error.message)
            const result = await supabase
              .from('mensagens')
              .select('*')
              .eq('conversa_id', conversaId)
              .order('created_at', { ascending: true })

            data = result.data
            dataError = result.error
          } else {
            // Outro erro - pode ser que a tabela não existe ou RLS bloqueou
            data = resultSimple.data
            dataError = resultSimple.error
          }
        } else {
          // Funcionou sem order, usar os dados e ordenar no cliente
          data = resultSimple.data
          dataError = null
          if (data && data.length > 0) {
            // Ordenar por timestamp ou created_at
            data.sort((a: any, b: any) => {
              const dateA = a.timestamp || a.created_at || ''
              const dateB = b.timestamp || b.created_at || ''
              return new Date(dateA).getTime() - new Date(dateB).getTime()
            })
          }
        }
      }

      if (dataError) {
        console.error('Erro ao buscar mensagens:', {
          message: dataError.message,
          details: dataError.details,
          hint: dataError.hint,
          code: dataError.code,
          error: dataError
        })
        throw dataError
      }

      setMensagens(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar mensagens:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        error: err
      })
      setError(err?.message || 'Erro ao carregar mensagens')
      setMensagens([])
    } finally {
      setLoading(false)
    }
  }, [conversaId])

  const sendMessage = useCallback(
    async (conteudo: string, remetente: 'usuario' | 'agente' | 'bot' = 'agente') => {
      if (!conversaId) {
        throw new Error('Conversa ID é obrigatório')
      }

      try {
        const { data, error: insertError } = await supabase
          .from('mensagens')
          .insert({
            conversa_id: conversaId,
            conteudo,
            remetente,
            tipo_mensagem: 'texto',
            lida: false,
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Atualizar a última mensagem na conversa
        await supabase
          .from('conversas_whatsapp')
          .update({
            ultima_mensagem: conteudo,
            data_ultima_mensagem: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversaId)

        // Recarregar mensagens
        await fetchMensagens()
      } catch (err: any) {
        console.error('Erro ao enviar mensagem:', err)
        throw err
      }
    },
    [conversaId, fetchMensagens]
  )

  useEffect(() => {
    fetchMensagens()
  }, [fetchMensagens])

  // Supabase Realtime subscription para mensagens
  useEffect(() => {
    if (!conversaId) return

    const channel = supabase
      .channel(`mensagens:${conversaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mensagens',
          filter: `conversa_id=eq.${conversaId}`,
        },
        (payload) => {
          // Atualizar mensagens quando houver mudanças
          fetchMensagens()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversaId, fetchMensagens])

  return {
    mensagens,
    loading,
    error,
    refetch: fetchMensagens,
    sendMessage,
  }
}

