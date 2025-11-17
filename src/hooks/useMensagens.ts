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

      const { data, error: dataError } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('timestamp', { ascending: true })

      if (dataError) throw dataError

      setMensagens(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar mensagens:', err)
      setError(err.message || 'Erro ao carregar mensagens')
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

  return {
    mensagens,
    loading,
    error,
    refetch: fetchMensagens,
    sendMessage,
  }
}

