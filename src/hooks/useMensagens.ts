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
  isTyping: boolean
  setIsTyping: (typing: boolean) => void
  isSending: boolean
}

export function useMensagens({ conversaId }: UseMensagensOptions): UseMensagensReturn {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTyping, setIsTypingState] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isSending, setIsSending] = useState(false)

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

      if (!conteudo || !conteudo.trim()) {
        throw new Error('Conteúdo da mensagem é obrigatório')
      }

      try {
        const timestamp = new Date().toISOString()
        
        const mensagemData: any = {
          conversa_id: conversaId,
          conteudo: conteudo.trim(),
          remetente,
          tipo_mensagem: 'texto',
        }

        // Adicionar timestamp se a coluna existir
        // Tentar inserir com timestamp primeiro
        const { data, error: insertError } = await supabase
          .from('mensagens')
          .insert({
            ...mensagemData,
            timestamp,
          })
          .select()
          .single()

        // Se falhar com timestamp, tentar sem timestamp (pode ser que a coluna não exista)
        if (insertError) {
          // Verificar se o erro é relacionado a timestamp
          if (insertError.message?.includes('timestamp') || insertError.code === '42703' || insertError.code === '42883') {
            console.warn('Tentando inserir sem timestamp:', insertError.message)
            
            const { data: dataWithoutTimestamp, error: insertError2 } = await supabase
              .from('mensagens')
              .insert(mensagemData)
              .select()
              .single()

            if (insertError2) {
              const errorMessage2 = insertError2?.message || 'Erro desconhecido ao inserir mensagem'
              const errorCode2 = insertError2?.code || 'N/A'
              const errorDetails2 = insertError2?.details || 'Sem detalhes'
              const errorHint2 = insertError2?.hint || 'Sem hint'
              
              // Só logar se houver informações úteis
              if (errorMessage2 !== 'Erro desconhecido ao inserir mensagem' || errorCode2 !== 'N/A') {
                console.error('Erro ao inserir mensagem (sem timestamp):', {
                  message: errorMessage2,
                  code: errorCode2,
                  details: errorDetails2,
                  hint: errorHint2
                })
              } else {
                console.error('Erro ao inserir mensagem (sem timestamp):', insertError2)
              }
              
              throw new Error(errorMessage2)
            }

            // Atualizar a última mensagem na conversa
            await supabase
              .from('conversas_whatsapp')
              .update({
                ultima_mensagem: conteudo.trim(),
                data_ultima_mensagem: timestamp,
                updated_at: timestamp,
              })
              .eq('id', conversaId)

            // Recarregar mensagens
            await fetchMensagens()

            // Enviar mensagem via WhatsApp API (apenas para mensagens de agente)
            if (remetente === 'agente') {
              try {
                setIsSending(true)
                const response = await fetch('/api/whatsapp/send', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    conversa_id: conversaId,
                    conteudo: conteudo.trim(),
                    remetente: 'agente',
                    tipo_mensagem: 'texto',
                  }),
                })

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}))
                  console.warn('Erro ao enviar mensagem via WhatsApp:', errorData)
                  
                  // Exibir mensagem de erro mais detalhada para o usuário
                  const errorMessage = errorData.error || 'Erro ao enviar mensagem'
                  const errorDetails = errorData.details || errorData.message || ''
                  const errorSolution = errorData.solution || ''
                  
                  // Criar mensagem completa e formatada
                  let fullMessage = `❌ ${errorMessage}`
                  if (errorDetails) fullMessage += `\n\n📋 ${errorDetails}`
                  if (errorSolution) fullMessage += `\n\n💡 Solução: ${errorSolution}`
                  
                  // Exibir alert com mensagem formatada
                  // Nota: Em produção, considere usar um sistema de notificações toast
                  alert(fullMessage)
                } else {
                  const result = await response.json()
                  console.log('Mensagem enviada via WhatsApp com sucesso:', result)
                }
              } catch (err: any) {
                console.error('Erro ao chamar API de envio WhatsApp:', err)
              } finally {
                setIsSending(false)
              }
            }
            return
          }

          // Se não for erro de timestamp, lançar o erro original
          const errorMessage = insertError?.message || 'Erro desconhecido ao inserir mensagem'
          const errorCode = insertError?.code || 'N/A'
          const errorDetails = insertError?.details || 'Sem detalhes'
          const errorHint = insertError?.hint || 'Sem hint'
          
          // Só logar se houver informações úteis
          if (errorMessage !== 'Erro desconhecido ao inserir mensagem' || errorCode !== 'N/A') {
            console.error('Erro ao inserir mensagem:', {
              message: errorMessage,
              code: errorCode,
              details: errorDetails,
              hint: errorHint
            })
          } else {
            // Se não houver informações úteis, logar o erro completo de forma diferente
            console.error('Erro ao inserir mensagem:', insertError)
          }
          
          throw new Error(errorMessage)
        }

        // Atualizar a última mensagem na conversa
        await supabase
          .from('conversas_whatsapp')
          .update({
            ultima_mensagem: conteudo.trim(),
            data_ultima_mensagem: timestamp,
            updated_at: timestamp,
          })
          .eq('id', conversaId)

        // Recarregar mensagens
        await fetchMensagens()

        // Enviar mensagem via WhatsApp API (apenas para mensagens de agente)
        if (remetente === 'agente') {
          try {
            setIsSending(true)
            const response = await fetch('/api/whatsapp/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                conversa_id: conversaId,
                conteudo: conteudo.trim(),
                remetente: 'agente',
                tipo_mensagem: 'texto',
              }),
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              console.warn('Erro ao enviar mensagem via WhatsApp:', errorData)
              
              // Exibir mensagem de erro mais detalhada para o usuário
              const errorMessage = errorData.error || 'Erro ao enviar mensagem'
              const errorDetails = errorData.details || errorData.message || ''
              const errorSolution = errorData.solution || ''
              
              // Criar mensagem completa e formatada
              let fullMessage = `❌ ${errorMessage}`
              if (errorDetails) fullMessage += `\n\n📋 ${errorDetails}`
              if (errorSolution) fullMessage += `\n\n💡 Solução: ${errorSolution}`
              
              // Exibir alert com mensagem formatada
              // Nota: Em produção, considere usar um sistema de notificações toast
              alert(fullMessage)
              
              // Não lançar erro - mensagem já está salva no banco
              // Apenas logar o erro para debug
            } else {
              const result = await response.json()
              console.log('Mensagem enviada via WhatsApp com sucesso:', result)
            }
          } catch (err: any) {
            console.error('Erro ao chamar API de envio WhatsApp:', err)
            // Não lançar erro - mensagem já está salva no banco
          } finally {
            setIsSending(false)
          }
        }
      } catch (err: any) {
        console.error('Erro ao enviar mensagem:', {
          message: err?.message,
          details: err?.details,
          hint: err?.hint,
          code: err?.code,
          error: err
        })
        setIsSending(false)
        throw new Error(err?.message || 'Erro ao enviar mensagem')
      }
    },
    [conversaId, fetchMensagens]
  )

  useEffect(() => {
    fetchMensagens()
  }, [fetchMensagens])

  // Função para atualizar indicador de digitação
  const updateTypingIndicator = useCallback(async (typing: boolean) => {
    if (!conversaId) return

    try {
      await supabase.rpc('atualizar_typing_indicator', {
        p_conversa_id: conversaId,
        p_usuario_id: null, // Pode ser obtido do contexto de autenticação
        p_usuario_tipo: 'atendente',
        p_is_typing: typing
      })
    } catch (error) {
      console.warn('Erro ao atualizar indicador de digitação:', error)
    }
  }, [conversaId])

  // Função para controlar estado de digitação com debounce
  const setIsTyping = useCallback((typing: boolean) => {
    setIsTypingState(typing)
    updateTypingIndicator(typing)

    // Limpar timeout anterior
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    // Se parou de digitar, aguardar 2 segundos antes de remover indicador
    if (!typing) {
      const timeout = setTimeout(() => {
        updateTypingIndicator(false)
        setIsTypingState(false)
      }, 2000)
      setTypingTimeout(timeout)
    }
  }, [updateTypingIndicator, typingTimeout])

  // Limpar indicador quando componente desmonta
  useEffect(() => {
    return () => {
      if (conversaId) {
        updateTypingIndicator(false)
      }
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
    }
  }, [conversaId, typingTimeout, updateTypingIndicator])

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

  // Supabase Realtime subscription para indicadores de digitação
  useEffect(() => {
    if (!conversaId) return

    let typingChannel: any = null

    // Usar broadcast channel para typing indicators (mais eficiente que tabela)
    typingChannel = supabase
      .channel(`typing:${conversaId}`)
      .on(
        'broadcast',
        {
          event: 'typing'
        },
        (payload) => {
          // O indicador será atualizado via query direta
        }
      )
      .subscribe()

    // Alternativamente, usar subscription na tabela typing_indicators
    const typingTableChannel = supabase
      .channel(`typing_indicators:${conversaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversa_id=eq.${conversaId}`
        },
        () => {
          // Verificar indicadores ativos periodicamente
          checkTypingIndicators()
        }
      )
      .subscribe()

    // Função para verificar indicadores ativos
    const checkTypingIndicators = async () => {
      try {
        const { data } = await supabase
          .from('typing_indicators')
          .select('*')
          .eq('conversa_id', conversaId)
          .eq('is_typing', true)
          .gt('expires_at', new Date().toISOString())

        // Atualizar estado se houver alguém digitando
        setIsTypingState((data && data.length > 0) || false)
      } catch (error) {
        console.warn('Erro ao verificar indicadores de digitação:', error)
      }
    }

    // Verificar a cada 1 segundo
    const interval = setInterval(checkTypingIndicators, 1000)

    return () => {
      if (typingChannel) {
        supabase.removeChannel(typingChannel)
      }
      if (typingTableChannel) {
        supabase.removeChannel(typingTableChannel)
      }
      clearInterval(interval)
    }
  }, [conversaId])

  return {
    mensagens,
    loading,
    error,
    refetch: fetchMensagens,
    sendMessage,
    isTyping,
    setIsTyping,
    isSending,
  }
}

