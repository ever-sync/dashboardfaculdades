'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  MessageSquare, 
  Search, 
  User, 
  Clock, 
  Send,
  Phone,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
  DollarSign,
  TrendingUp,
  BookOpen,
  X,
  BarChart3,
  Bot,
  UserCog,
  UserCheck,
  Paperclip,
  Image,
  File,
  Smile,
  Zap,
  MoreVertical,
  CheckCheck,
  ArrowRight,
  Pause,
  Play,
  Download,
  Ban,
  Unlock,
  ArrowRightLeft,
  XCircle,
  RotateCcw
} from 'lucide-react'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { useMensagens } from '@/hooks/useMensagens'
import { Prospect, Curso } from '@/types/supabase'
import { useDebounce } from '@/lib/debounce'
import { TransferirModal } from '@/components/dashboard/TransferirModal'
import { MetricasModal } from '@/components/dashboard/MetricasModal'
import { TagsManager } from '@/components/dashboard/TagsManager'
import { AnotacoesPanel } from '@/components/dashboard/AnotacoesPanel'
import { TimelineProspect } from '@/components/dashboard/TimelineProspect'
import { RespostasAutomaticas } from '@/components/dashboard/RespostasAutomaticas'
import { ScriptSuggestions } from '@/components/dashboard/ScriptSuggestions'
import { SugestoesBase } from '@/components/dashboard/SugestoesBase'
import { AgendarMensagem } from '@/components/dashboard/AgendarMensagem'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { exportarConversaTXT } from '@/lib/exportarConversa'

interface ConversaWhatsApp {
  id: string
  nome: string
  telefone: string
  ultima_mensagem?: string
  data_ultima_mensagem: string
  status: string
  nao_lidas?: number
  faculdade_id?: string
  prospect_id?: string
  tags?: string[]
}

interface Conversa {
  id: string
  nome: string
  telefone: string
  ultimaMensagem: string
  hora: string
  status: 'ativo' | 'pendente' | 'finalizado'
  naoLidas: number
  totalMensagens: number // Quantidade total de mensagens vinculadas
  avatar: string
  prospect_id?: string
}

// Funções helper para formatar datas (apenas no cliente)
const formatTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'N/A'
  }
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('pt-BR')
  } catch {
    return 'N/A'
  }
}

export default function ConversasPage() {
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null)
  const [conversaDetalhes, setConversaDetalhes] = useState<ConversaWhatsApp | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  
  // Debounce do termo de busca
  const debouncedSearchTerm = useDebounce(searchTerm, 400)
  const [novaMensagem, setNovaMensagem] = useState('')
  const [loading, setLoading] = useState(true)
  const [prospectInfo, setProspectInfo] = useState<Prospect | null>(null)
  const [loadingProspect, setLoadingProspect] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showAnexos, setShowAnexos] = useState(false)
  const [showCursos, setShowCursos] = useState(false)
  const [showBaseConhecimento, setShowBaseConhecimento] = useState(false)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loadingCursos, setLoadingCursos] = useState(false)
  const [iaPausada, setIaPausada] = useState(false)
  const [showTransferirModal, setShowTransferirModal] = useState(false)
  const [showMetricasModal, setShowMetricasModal] = useState(false)
  const [showAgendarModal, setShowAgendarModal] = useState(false)
  const [buscaAvancada, setBuscaAvancada] = useState(false)
  const [filtroBusca, setFiltroBusca] = useState({
    query: '',
    buscaMensagens: false,
    setor: '',
    status: '',
    dataInicio: '',
    dataFim: '',
    tags: [] as string[]
  })
  const itemsPerPage = 20
  const { faculdadeSelecionada } = useFaculdade()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Garantir que só renderize após montar no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Hook para buscar mensagens
  const { mensagens, loading: loadingMensagens, sendMessage, refetch: refetchMensagens, isTyping: clienteDigitando, setIsTyping: setClienteDigitando } = useMensagens({
    conversaId: conversaSelecionada
  })
  const [isTypingLocal, setIsTypingLocal] = useState(false)

  const fetchConversas = useCallback(async () => {
    if (!faculdadeSelecionada) {
      setConversas([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Buscar contagem total
      const { count, error: countError } = await supabase
        .from('conversas_whatsapp')
        .select('*', { count: 'exact', head: true })
        .eq('faculdade_id', faculdadeSelecionada.id)

      if (countError) {
        console.warn('Erro ao contar conversas:', countError.message)
      } else if (count !== null) {
        setTotalCount(count)
        setTotalPages(Math.ceil(count / itemsPerPage))
      }

      // Buscar conversas paginadas
      const startIndex = (currentPage - 1) * itemsPerPage
      const { data, error } = await supabase
        .from('conversas_whatsapp')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + itemsPerPage - 1)

      if (error) {
        console.error('Erro ao buscar conversas do Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          error: error
        })
        
        // Tentar sem range e order
        const { data: dataSimple, error: errorSimple } = await supabase
          .from('conversas_whatsapp')
          .select('*')
          .eq('faculdade_id', faculdadeSelecionada.id)
          .limit(itemsPerPage)

        if (errorSimple) {
          console.error('Erro mesmo na query simples:', errorSimple)
          setConversas([])
          return
        }

        // Buscar nomes dos prospects se houver prospect_id ou telefone
        const prospectIds = (dataSimple || []).filter(c => c.prospect_id).map(c => c.prospect_id)
        const telefonesSemProspectId = (dataSimple || [])
          .filter(c => !c.prospect_id && c.telefone)
          .map(c => {
            const tel = c.telefone.replace('@s.whatsapp.net', '')
            return { conversaId: c.id, telefone: tel }
          })
        
        let prospectsMap: Record<string, { nome?: string; nome_completo?: string }> = {}
        
        // Buscar prospects por ID
        if (prospectIds.length > 0) {
          const { data: prospects } = await supabase
            .from('prospects_academicos')
            .select('id, nome, nome_completo')
            .in('id', prospectIds)
            .eq('faculdade_id', faculdadeSelecionada.id)
          
          if (prospects) {
            prospects.forEach(p => {
              prospectsMap[p.id] = { nome: p.nome, nome_completo: p.nome_completo }
            })
          }
        }
        
        // Buscar prospects por telefone para conversas sem prospect_id
        if (telefonesSemProspectId.length > 0) {
          const telefonesUnicos = [...new Set(telefonesSemProspectId.map(t => t.telefone))]
          for (const telefone of telefonesUnicos) {
            // Buscar por telefone exato
            const { data: prospectTelExato } = await supabase
              .from('prospects_academicos')
              .select('id, nome, nome_completo, telefone')
              .eq('telefone', telefone)
              .eq('faculdade_id', faculdadeSelecionada.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            
            if (prospectTelExato) {
              telefonesSemProspectId
                .filter(t => t.telefone === telefone)
                .forEach(t => {
                  prospectsMap[t.conversaId] = { 
                    nome: prospectTelExato.nome, 
                    nome_completo: prospectTelExato.nome_completo 
                  }
                })
              continue
            }
            
            // Se não encontrou, tentar buscar com @s.whatsapp.net
            const { data: prospectTelWhatsApp } = await supabase
              .from('prospects_academicos')
              .select('id, nome, nome_completo, telefone')
              .eq('telefone', `${telefone}@s.whatsapp.net`)
              .eq('faculdade_id', faculdadeSelecionada.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            
            if (prospectTelWhatsApp) {
              telefonesSemProspectId
                .filter(t => t.telefone === telefone)
                .forEach(t => {
                  prospectsMap[t.conversaId] = { 
                    nome: prospectTelWhatsApp.nome, 
                    nome_completo: prospectTelWhatsApp.nome_completo 
                  }
                })
            }
          }
        }
        
        // Buscar contagem de mensagens por conversa
        const conversaIds = (dataSimple || []).map(c => c.id)
        let mensagensCountMap: Record<string, number> = {}
        
        if (conversaIds.length > 0) {
          const { data: mensagensCount } = await supabase
            .from('mensagens')
            .select('conversa_id')
            .in('conversa_id', conversaIds)
          
          if (mensagensCount) {
            // Contar mensagens por conversa_id
            mensagensCount.forEach(m => {
              mensagensCountMap[m.conversa_id] = (mensagensCountMap[m.conversa_id] || 0) + 1
            })
          }
        }

        const conversasFormatadas: Conversa[] = (dataSimple || []).map((c: any) => {
          // Priorizar nome do prospect sobre nome da conversa
          let prospectNome = null
          if (c.prospect_id && prospectsMap[c.prospect_id]) {
            prospectNome = prospectsMap[c.prospect_id].nome || prospectsMap[c.prospect_id].nome_completo
          } else if (prospectsMap[c.id]) {
            prospectNome = prospectsMap[c.id].nome || prospectsMap[c.id].nome_completo
          }
          const nome = prospectNome || c.nome || 'Sem nome'
          const statusBruto = c.status_conversa || c.status || 'pendente'
          const statusNormalizado: 'ativo' | 'pendente' | 'finalizado' =
            statusBruto === 'encerrada' || statusBruto === 'encerrado'
              ? 'finalizado'
              : statusBruto === 'pendente'
                ? 'pendente'
                : statusBruto === 'ativa' || statusBruto === 'ativo'
                  ? 'ativo'
                  : 'pendente'

          const ultimaMensagem = c.ultima_mensagem || c.mensagem || 'Sem mensagens'
          const dataMensagem = c.data_ultima_mensagem || c.data_hora || c.created_at || c.updated_at
          const totalMensagens = mensagensCountMap[c.id] || 0

          return {
            id: c.id,
            nome,
            telefone: c.telefone || 'Não informado',
            ultimaMensagem,
            hora: formatTime(dataMensagem),
            status: statusNormalizado,
            naoLidas: c.nao_lidas || c.nao_lidas_count || 0,
            totalMensagens,
            avatar: nome
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase(),
            prospect_id: c.prospect_id || undefined
          }
        })

        setConversas(conversasFormatadas)
        return
      }

      // Buscar nomes dos prospects se houver prospect_id ou telefone
      const prospectIds = (data || []).filter(c => c.prospect_id).map(c => c.prospect_id)
      const telefonesSemProspectId = (data || [])
        .filter(c => !c.prospect_id && c.telefone)
        .map(c => {
          // Limpar telefone do formato WhatsApp
          const tel = c.telefone.replace('@s.whatsapp.net', '')
          return { conversaId: c.id, telefone: tel }
        })
      
      let prospectsMap: Record<string, { nome?: string; nome_completo?: string }> = {}
      
      // Buscar prospects por ID
      if (prospectIds.length > 0) {
        const { data: prospects } = await supabase
          .from('prospects_academicos')
          .select('id, nome, nome_completo')
          .in('id', prospectIds)
          .eq('faculdade_id', faculdadeSelecionada.id)
        
        if (prospects) {
          prospects.forEach(p => {
            prospectsMap[p.id] = { nome: p.nome, nome_completo: p.nome_completo }
          })
        }
      }
      
      // Buscar prospects por telefone para conversas sem prospect_id
      if (telefonesSemProspectId.length > 0) {
        const telefonesUnicos = [...new Set(telefonesSemProspectId.map(t => t.telefone))]
        for (const telefone of telefonesUnicos) {
          // Buscar por telefone exato
          const { data: prospectTelExato } = await supabase
            .from('prospects_academicos')
            .select('id, nome, nome_completo, telefone')
            .eq('telefone', telefone)
            .eq('faculdade_id', faculdadeSelecionada.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (prospectTelExato) {
            telefonesSemProspectId
              .filter(t => t.telefone === telefone)
              .forEach(t => {
                prospectsMap[t.conversaId] = { 
                  nome: prospectTelExato.nome, 
                  nome_completo: prospectTelExato.nome_completo 
                }
              })
            continue
          }
          
          // Se não encontrou, tentar buscar com @s.whatsapp.net
          const { data: prospectTelWhatsApp } = await supabase
            .from('prospects_academicos')
            .select('id, nome, nome_completo, telefone')
            .eq('telefone', `${telefone}@s.whatsapp.net`)
            .eq('faculdade_id', faculdadeSelecionada.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (prospectTelWhatsApp) {
            telefonesSemProspectId
              .filter(t => t.telefone === telefone)
              .forEach(t => {
                prospectsMap[t.conversaId] = { 
                  nome: prospectTelWhatsApp.nome, 
                  nome_completo: prospectTelWhatsApp.nome_completo 
                }
              })
          }
        }
      }
      
      // Buscar contagem de mensagens por conversa
      const conversaIds = (data || []).map(c => c.id)
      let mensagensCountMap: Record<string, number> = {}
      
      if (conversaIds.length > 0) {
        const { data: mensagensCount } = await supabase
          .from('mensagens')
          .select('conversa_id')
          .in('conversa_id', conversaIds)
        
        if (mensagensCount) {
          // Contar mensagens por conversa_id
          mensagensCount.forEach(m => {
            mensagensCountMap[m.conversa_id] = (mensagensCountMap[m.conversa_id] || 0) + 1
          })
        }
      }

      const conversasFormatadas: Conversa[] = (data || []).map((c: any) => {
        // Priorizar nome do prospect sobre nome da conversa
        // Buscar por prospect_id primeiro, depois por conversaId (telefone)
        let prospectNome = null
        if (c.prospect_id && prospectsMap[c.prospect_id]) {
          prospectNome = prospectsMap[c.prospect_id].nome || prospectsMap[c.prospect_id].nome_completo
        } else if (prospectsMap[c.id]) {
          // Se não tem prospect_id mas foi encontrado por telefone
          prospectNome = prospectsMap[c.id].nome || prospectsMap[c.id].nome_completo
        }
        const nome = prospectNome || c.nome || 'Sem nome'
        const statusBruto = c.status_conversa || c.status || 'pendente'
        const statusNormalizado: 'ativo' | 'pendente' | 'finalizado' =
          statusBruto === 'encerrada' || statusBruto === 'encerrado'
            ? 'finalizado'
            : statusBruto === 'pendente'
              ? 'pendente'
              : statusBruto === 'ativa' || statusBruto === 'ativo'
                ? 'ativo'
                : 'pendente'

        const ultimaMensagem = c.ultima_mensagem || c.mensagem || 'Sem mensagens'
        const dataMensagem = c.data_ultima_mensagem || c.data_hora || c.created_at || c.updated_at
        const totalMensagens = mensagensCountMap[c.id] || 0

        return {
          id: c.id,
          nome,
          telefone: c.telefone || 'Não informado',
          ultimaMensagem,
          hora: dataMensagem
            ? new Date(dataMensagem).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'N/A',
          status: statusNormalizado,
          naoLidas: c.nao_lidas || c.nao_lidas_count || 0,
          totalMensagens,
          avatar: nome
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase(),
          prospect_id: c.prospect_id || undefined
        }
      })

      setConversas(conversasFormatadas)
    } catch (error: any) {
      console.warn('Erro inesperado ao buscar conversas:', error?.message || error)
      setConversas([])
    } finally {
      setLoading(false)
    }
  }, [faculdadeSelecionada, currentPage, itemsPerPage])

  // Buscar detalhes da conversa e prospect quando selecionar
  useEffect(() => {
    const fetchConversaDetalhes = async () => {
      if (!conversaSelecionada || !faculdadeSelecionada) {
        setConversaDetalhes(null)
        setProspectInfo(null)
        return
      }

      try {
        setLoadingProspect(true)
        
        // Buscar detalhes da conversa
        const { data: conversaData, error: conversaError } = await supabase
          .from('conversas_whatsapp')
          .select('*')
          .eq('id', conversaSelecionada)
          .single()

        if (conversaError) {
          console.error('Erro ao buscar detalhes da conversa:', {
            message: conversaError.message,
            details: conversaError.details,
            hint: conversaError.hint,
            code: conversaError.code
          })
          setLoadingProspect(false)
          return
        }

        // Garantir que tags seja um array válido
        const conversaFormatada = {
          ...conversaData,
          tags: Array.isArray(conversaData.tags) ? conversaData.tags : (conversaData.tags ? [conversaData.tags] : [])
        }

        setConversaDetalhes(conversaFormatada as ConversaWhatsApp)

        // Limpar telefone para busca
        let telefoneLimpo = conversaData.telefone || ''
        telefoneLimpo = telefoneLimpo.replace('@s.whatsapp.net', '').replace(/\D/g, '') // Remove caracteres não numéricos

        // Buscar prospect na tabela prospects_academicos
        let prospectEncontrado: Prospect | null = null

        // 1. Tentar buscar por prospect_id se existir
        if (conversaData.prospect_id) {
          const { data: prospectData, error: prospectError } = await supabase
            .from('prospects_academicos')
            .select('*')
            .eq('id', conversaData.prospect_id)
            .eq('faculdade_id', faculdadeSelecionada.id)
            .single()

          if (!prospectError && prospectData) {
            prospectEncontrado = prospectData as any
            console.log('Prospect encontrado por ID:', prospectEncontrado)
          } else {
            console.warn('Prospect não encontrado por ID, tentando por telefone:', prospectError)
          }
        }

        // 2. Se não encontrou por ID, tentar buscar por telefone
        if (!prospectEncontrado && telefoneLimpo) {
          // Buscar exato primeiro
          const { data: prospectExato } = await supabase
            .from('prospects_academicos')
            .select('*')
            .eq('telefone', telefoneLimpo)
            .eq('faculdade_id', faculdadeSelecionada.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (prospectExato) {
            prospectEncontrado = prospectExato as any
            console.log('Prospect encontrado por telefone exato:', prospectEncontrado)
          } else {
            // Tentar buscar sem limpar tanto (com formato original)
            const telefoneOriginal = conversaData.telefone.replace('@s.whatsapp.net', '')
            const { data: prospectOriginal } = await supabase
              .from('prospects_academicos')
              .select('*')
              .eq('telefone', telefoneOriginal)
              .eq('faculdade_id', faculdadeSelecionada.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            if (prospectOriginal) {
              prospectEncontrado = prospectOriginal as any
              console.log('Prospect encontrado por telefone original:', prospectEncontrado)
            }
          }
        }

        // 3. Se ainda não encontrou, tentar busca parcial (contém)
        if (!prospectEncontrado && telefoneLimpo && telefoneLimpo.length >= 8) {
          const { data: prospectsParciais } = await supabase
            .from('prospects_academicos')
            .select('*')
            .eq('faculdade_id', faculdadeSelecionada.id)
            .ilike('telefone', `%${telefoneLimpo.slice(-8)}%`) // Últimos 8 dígitos
            .order('created_at', { ascending: false })
            .limit(1)

          if (prospectsParciais && prospectsParciais.length > 0) {
            prospectEncontrado = prospectsParciais[0] as any
            console.log('Prospect encontrado por busca parcial:', prospectEncontrado)
          }
        }

        // Definir prospect encontrado ou null
        if (prospectEncontrado) {
          setProspectInfo(prospectEncontrado)
        } else {
          console.log('Nenhum prospect encontrado para esta conversa')
          setProspectInfo(null)
        }
      } catch (error: any) {
        console.error('Erro ao buscar detalhes:', error)
        setProspectInfo(null)
      } finally {
        setLoadingProspect(false)
      }
    }

    fetchConversaDetalhes()
  }, [conversaSelecionada, faculdadeSelecionada])

  // Scroll automático para última mensagem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensagens])

  useEffect(() => {
    if (faculdadeSelecionada) fetchConversas()
  }, [faculdadeSelecionada, currentPage, fetchConversas])

  // Supabase Realtime subscription para conversas
  useEffect(() => {
    if (!faculdadeSelecionada) return

    const channel = supabase
      .channel(`conversas:${faculdadeSelecionada.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas_whatsapp',
          filter: `faculdade_id=eq.${faculdadeSelecionada.id}`,
        },
        (payload) => {
          // Atualizar conversas quando houver mudanças
          fetchConversas()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [faculdadeSelecionada?.id, fetchConversas])

  const conversasFiltradas = useMemo(() => {
    return conversas.filter(conversa => {
      const matchSearch = conversa.nome.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         conversa.ultimaMensagem.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchStatus = statusFilter === 'todos' || conversa.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [conversas, debouncedSearchTerm, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'success'
      case 'pendente': return 'warning'
      case 'finalizado': return 'info'
      default: return 'info'
    }
  }

  // Templates de mensagens rápidas
  const templatesMensagens = [
    'Olá! Como posso ajudá-lo hoje?',
    'Obrigado por entrar em contato!',
    'Posso ajudá-lo com informações sobre nossos cursos.',
    'Estou verificando isso para você...',
    'Alguma outra dúvida?',
    'Fico à disposição para ajudar!',
  ]

  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim() || !conversaSelecionada) return

    try {
      // Parar indicador de digitação ao enviar
      setIsTypingLocal(false)
      setClienteDigitando(false)
      
      await sendMessage(novaMensagem.trim(), 'agente')
      setNovaMensagem('')
      // Resetar altura do textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      await fetchConversas() // Atualizar lista de conversas
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        error: error
      })
      
      // Mensagem de erro mais amigável
      let errorMessage = 'Erro ao enviar mensagem'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.details) {
        errorMessage = error.details
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.error?.message) {
        errorMessage = error.error.message
      }
      
      alert(errorMessage)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter para nova linha, Enter para enviar
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviarMensagem()
    }
  }

  const handleSelectTemplate = (template: string) => {
    setNovaMensagem(template)
    setShowTemplates(false)
    textareaRef.current?.focus()
  }

  const handleMarcarComoLida = useCallback(async () => {
    if (!conversaSelecionada) return

    try {
      const response = await fetch('/api/conversas/marcar-lida', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversa_id: conversaSelecionada,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao marcar como lida')
      }

      // Atualizar lista de conversas
      await fetchConversas()
      // Recarregar mensagens para atualizar status de lidas
      await refetchMensagens()
    } catch (error: any) {
      console.error('Erro ao marcar como lida:', error)
      alert('Erro ao marcar como lida: ' + error.message)
    }
  }, [conversaSelecionada, fetchConversas, refetchMensagens])

  const handleTransferirSucesso = useCallback(async () => {
    // Recarregar conversas após transferência
    await fetchConversas()
    // Recarregar detalhes da conversa e mensagens
    if (conversaSelecionada) {
      await refetchMensagens()
      // Recarregar detalhes da conversa também
      const { data: conversaData } = await supabase
        .from('conversas_whatsapp')
        .select('*')
        .eq('id', conversaSelecionada)
        .single()
      
      if (conversaData) {
        const conversaFormatada = {
          ...conversaData,
          tags: Array.isArray(conversaData.tags) ? conversaData.tags : (conversaData.tags ? [conversaData.tags] : [])
        }
        setConversaDetalhes(conversaFormatada as ConversaWhatsApp)
      }
    }
  }, [conversaSelecionada, fetchConversas, refetchMensagens])

  // Função para agendar mensagem
  const handleAgendarMensagem = async (mensagemAgendada: Omit<import('@/types/supabase').MensagemAgendada, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/mensagens/agendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mensagemAgendada),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao agendar mensagem')
      }

      alert('Mensagem agendada com sucesso!')
      setShowAgendarModal(false)
    } catch (error: any) {
      console.error('Erro ao agendar mensagem:', error)
      throw error
    }
  }

  // Função para busca avançada
  const handleBuscaAvancada = useCallback(async () => {
    if (!faculdadeSelecionada) return

    if (!filtroBusca.query.trim()) {
      // Se não há query, apenas recarregar conversas normalmente
      await fetchConversas()
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/conversas/buscar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: filtroBusca.query,
          faculdade_id: faculdadeSelecionada.id,
          setor: filtroBusca.setor || undefined,
          status: filtroBusca.status || undefined,
          data_inicio: filtroBusca.dataInicio || undefined,
          data_fim: filtroBusca.dataFim || undefined,
          tags: filtroBusca.tags.length > 0 ? filtroBusca.tags : undefined,
          busca_mensagens: filtroBusca.buscaMensagens,
          limite: 100,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar conversas')
      }

      // Mapear resultados para formato de Conversa[]
      const conversasFormatadas: Conversa[] = (data.conversas || []).map((c: any) => {
        const prospect = c.prospects_academicos?.[0]
        const nome = prospect?.nome || prospect?.nome_completo || c.nome || 'Sem nome'
        const statusBruto = c.status_conversa || c.status || 'pendente'
        const statusNormalizado: 'ativo' | 'pendente' | 'finalizado' =
          statusBruto === 'encerrada' || statusBruto === 'encerrado'
            ? 'finalizado'
            : statusBruto === 'pendente'
              ? 'pendente'
              : statusBruto === 'ativa' || statusBruto === 'ativo'
                ? 'ativo'
                : 'pendente'

        return {
          id: c.id,
          nome,
          telefone: c.telefone || 'Não informado',
          ultimaMensagem: c.ultima_mensagem || 'Sem mensagens',
          hora: c.data_ultima_mensagem
            ? new Date(c.data_ultima_mensagem).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'N/A',
          status: statusNormalizado,
          naoLidas: c.nao_lidas || 0,
          totalMensagens: c.total_mensagens || 0,
          avatar: nome
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase(),
          prospect_id: c.prospect_id || undefined,
        }
      })

      setConversas(conversasFormatadas)
      setTotalCount(conversasFormatadas.length)
      setTotalPages(1)
      setCurrentPage(1)
    } catch (error: any) {
      console.error('Erro ao buscar conversas:', error)
      alert('Erro ao buscar conversas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [faculdadeSelecionada, filtroBusca, fetchConversas])

  // Buscar cursos da faculdade selecionada
  const fetchCursos = useCallback(async () => {
    if (!faculdadeSelecionada) {
      setCursos([])
      return
    }

    try {
      setLoadingCursos(true)
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .eq('ativo', true)
        .order('curso', { ascending: true })

      if (error) {
        console.error('Erro ao buscar cursos:', error)
        setCursos([])
        return
      }

      setCursos(data || [])
    } catch (error: any) {
      console.error('Erro inesperado ao buscar cursos:', error)
      setCursos([])
    } finally {
      setLoadingCursos(false)
    }
  }, [faculdadeSelecionada])

  // Buscar cursos quando abrir o menu
  useEffect(() => {
    if (showCursos && faculdadeSelecionada && cursos.length === 0) {
      fetchCursos()
    }
  }, [showCursos, faculdadeSelecionada, fetchCursos, cursos.length])

  // Formatar informações do curso para mensagem
  const formatarInformacoesCurso = (curso: Curso): string => {
    const partes: string[] = []
    
    partes.push(`📚 *${curso.curso}*`)
    
    if (curso.descricao) {
      partes.push(`\n${curso.descricao}`)
    }
    
    partes.push(`\n\n📋 *Informações:*`)
    partes.push(`• Modalidade: ${curso.modalidade}`)
    partes.push(`• Duração: ${curso.duracao}`)
    partes.push(`• Parcelas: ${curso.quantidade_de_parcelas}x`)
    
    if (curso.valor_com_desconto_pontualidade) {
      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(Number(curso.valor_com_desconto_pontualidade))
      partes.push(`• Valor com desconto: ${valorFormatado}`)
    }
    
    if (curso.desconto_percentual > 0) {
      partes.push(`• Desconto: ${curso.desconto_percentual}%`)
    }
    
    if (curso.categoria) {
      partes.push(`• Categoria: ${curso.categoria}`)
    }
    
    const caracteristicas: string[] = []
    if (curso.pratica) caracteristicas.push('Prática')
    if (curso.laboratorio) caracteristicas.push('Laboratório')
    if (curso.estagio) caracteristicas.push('Estágio')
    if (curso.tcc) caracteristicas.push('TCC')
    
    if (caracteristicas.length > 0) {
      partes.push(`• Características: ${caracteristicas.join(', ')}`)
    }
    
    if (curso.link) {
      partes.push(`\n🔗 Mais informações: ${curso.link}`)
    }
    
    return partes.join('\n')
  }

  const handleSelectCurso = (curso: Curso) => {
    const informacoesFormatadas = formatarInformacoesCurso(curso)
    setNovaMensagem(informacoesFormatadas)
    setShowCursos(false)
    textareaRef.current?.focus()
  }

  const handleAnexoClick = (tipo: 'image' | 'file') => {
    // Criar input file invisível
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = tipo === 'image' ? 'image/*' : '*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Aqui você pode implementar upload de arquivo
        alert(`Arquivo selecionado: ${file.name}\nImplementar upload...`)
      }
    }
    input.click()
    setShowAnexos(false)
  }

  const handlePausarIA = async () => {
    if (!conversaSelecionada) {
      alert('Selecione uma conversa primeiro')
      return
    }

    try {
      const novaEstado = !iaPausada
      
      // Preparar tags atualizadas
      const tagsAtuais = conversaDetalhes?.tags || []
      const tagsArray = Array.isArray(tagsAtuais) ? tagsAtuais : []
      
      let novasTags: string[]
      if (novaEstado) {
        // Adicionar tag IA_PAUSADA se não existir
        if (!tagsArray.includes('IA_PAUSADA')) {
          novasTags = [...tagsArray, 'IA_PAUSADA']
        } else {
          novasTags = tagsArray
        }
      } else {
        // Remover tag IA_PAUSADA
        novasTags = tagsArray.filter((tag: string) => tag !== 'IA_PAUSADA')
      }

      // Atualizar no banco de dados
      const { data, error } = await supabase
        .from('conversas_whatsapp')
        .update({ 
          tags: novasTags.length > 0 ? novasTags : null
        })
        .eq('id', conversaSelecionada)
        .select()
        .single()

      if (error) {
        console.error('Erro ao pausar IA:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          error: error
        })
        alert(`Erro ao ${novaEstado ? 'pausar' : 'retomar'} IA: ${error.message || 'Erro desconhecido'}`)
        return
      }

      // Atualizar estado local
      setIaPausada(novaEstado)
      
      // Atualizar conversaDetalhes com os novos dados
      if (data) {
        const conversaAtualizada = {
          ...data,
          tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : [])
        }
        setConversaDetalhes(conversaAtualizada as ConversaWhatsApp)
      }

      // Enviar mensagem informando pausa/retomada
      try {
        const mensagemIA = novaEstado
          ? '🤖 IA pausada. Agora você está no atendimento manual.'
          : '🤖 IA retomada. Atendimento automático reativado.'

        await sendMessage(mensagemIA, 'agente')
      } catch (msgError: any) {
        console.warn('Erro ao enviar mensagem de pausa/retomada:', msgError)
        // Não bloquear a operação se falhar ao enviar mensagem
      }
      
      // Atualizar lista de conversas para refletir mudança
      await fetchConversas()
    } catch (error: any) {
      console.error('Erro inesperado ao pausar IA:', {
        message: error?.message,
        error: error
      })
      alert(`Erro ao ${!iaPausada ? 'pausar' : 'retomar'} IA: ${error?.message || 'Erro desconhecido'}`)
    }
  }

  // Verificar se IA está pausada ao carregar conversa
  useEffect(() => {
    if (conversaDetalhes) {
      const tags = conversaDetalhes.tags || []
      const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : [])
      setIaPausada(tagsArray.includes('IA_PAUSADA'))
    } else {
      setIaPausada(false)
    }
  }, [conversaDetalhes])

  // Auto-ajustar altura do textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 200 // máximo 200px (cerca de 8 linhas)
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }, [novaMensagem])

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.template-menu') && !target.closest('.anexo-menu') && !target.closest('.cursos-menu') && !target.closest('.base-conhecimento-menu')) {
        setShowTemplates(false)
        setShowAnexos(false)
        setShowCursos(false)
        setShowBaseConhecimento(false)
      }
    }

    if (showTemplates || showAnexos || showCursos || showBaseConhecimento) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTemplates, showAnexos, showCursos, showBaseConhecimento])

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Header
          title="Conversas"
          subtitle="Gerencie conversas e mensagens"
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  const conversaAtual = conversas.find(c => c.id === conversaSelecionada)

  return (
    <div className="h-screen bg-white text-black flex flex-col overflow-hidden">
      <Header
        title="Conversas"
        subtitle="Atendimento e Mensagens"
      />
      
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* COLUNA 1: Lista de Conversas */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
          {/* Busca e Filtros */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar conversas... (Ctrl+K)"
                value={filtroBusca.query || searchTerm}
                onChange={(e) => {
                  setFiltroBusca({ ...filtroBusca, query: e.target.value })
                  setSearchTerm(e.target.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleBuscaAvancada()
                  }
                }}
                className="pl-10 !bg-white !text-black"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setBuscaAvancada(!buscaAvancada)}
                className="absolute right-2 top-1/2 -translate-y-1/2 !bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                title="Busca avançada"
              >
                <Search className="w-3 h-3" />
              </Button>
            </div>
            
            {buscaAvancada && (
              <Card className="p-3 mb-3 bg-white border border-gray-200">
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Buscar em mensagens</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filtroBusca.buscaMensagens}
                        onChange={(e) => setFiltroBusca({ ...filtroBusca, buscaMensagens: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-xs text-gray-600">Buscar no conteúdo das mensagens</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Setor</label>
                      <select
                        value={filtroBusca.setor}
                        onChange={(e) => setFiltroBusca({ ...filtroBusca, setor: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded !bg-white !text-black"
                      >
                        <option value="">Todos</option>
                        <option value="Vendas">Vendas</option>
                        <option value="Suporte">Suporte</option>
                        <option value="Atendimento">Atendimento</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={filtroBusca.status}
                        onChange={(e) => setFiltroBusca({ ...filtroBusca, status: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded !bg-white !text-black"
                      >
                        <option value="">Todos</option>
                        <option value="ativa">Ativa</option>
                        <option value="pendente">Pendente</option>
                        <option value="encerrada">Encerrada</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Data Início</label>
                      <Input
                        type="date"
                        value={filtroBusca.dataInicio}
                        onChange={(e) => setFiltroBusca({ ...filtroBusca, dataInicio: e.target.value })}
                        className="text-xs !bg-white !text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Data Fim</label>
                      <Input
                        type="date"
                        value={filtroBusca.dataFim}
                        onChange={(e) => setFiltroBusca({ ...filtroBusca, dataFim: e.target.value })}
                        className="text-xs !bg-white !text-black"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleBuscaAvancada}
                      className="flex-1 !bg-gray-900 hover:!bg-gray-800"
                    >
                      Buscar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setFiltroBusca({
                          query: '',
                          buscaMensagens: false,
                          setor: '',
                          status: '',
                          dataInicio: '',
                          dataFim: '',
                          tags: [],
                        })
                        setSearchTerm('')
                        fetchConversas()
                      }}
                      className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              </Card>
            )}
            
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'todos' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatusFilter('todos')}
                className="flex-1 !bg-gray-100 !text-gray-900 hover:!bg-gray-200"
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'ativo' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatusFilter('ativo')}
                className="flex-1 !bg-gray-100 !text-gray-900 hover:!bg-gray-200"
              >
                Ativos
              </Button>
              <Button
                variant={statusFilter === 'pendente' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatusFilter('pendente')}
                className="flex-1 !bg-gray-100 !text-gray-900 hover:!bg-gray-200"
              >
                Pendentes
              </Button>
            </div>
          </div>
          
          {/* Lista de Conversas */}
          <div className="flex-1 overflow-y-auto">
            {conversasFiltradas.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  {searchTerm || statusFilter !== 'todos' ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa'}
                </h3>
                <p className="text-xs text-gray-600">
                  {searchTerm || statusFilter !== 'todos' 
                    ? 'Tente ajustar os filtros' 
                    : 'As conversas aparecerão aqui'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversasFiltradas.map((conversa) => (
                  <div
                    key={conversa.id}
                    onClick={() => setConversaSelecionada(conversa.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-100 ${
                      conversaSelecionada === conversa.id ? 'bg-gray-50 border-l-4 border-gray-300' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {conversa.avatar}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm truncate text-gray-900">{conversa.nome}</h4>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{conversa.hora}</span>
                        </div>
                        
                        <p className="text-xs text-gray-600 truncate mb-2">
                          {conversa.ultimaMensagem}
                        </p>
                        
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={getStatusColor(conversa.status)} className="text-xs">
                            {conversa.status}
                          </Badge>
                          
                          <div className="flex items-center gap-2">
                            {/* Contagem total de mensagens */}
                            <span className="text-xs text-gray-500" title={`${conversa.totalMensagens} mensagem(ns)`}>
                              💬 {conversa.totalMensagens}
                            </span>
                            
                            {/* Contador de não lidas */}
                            {conversa.naoLidas > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                {conversa.naoLidas}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span>Página {currentPage} de {totalPages}</span>
                <span>{totalCount} conversas</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex-1 !bg-gray-100 !text-gray-900 hover:!bg-gray-200"
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex-1 !bg-gray-100 !text-gray-900 hover:!bg-gray-200"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* COLUNA 2: Área do Chat */}
        <div className="flex-1 flex flex-col bg-white min-h-0 overflow-hidden">
          {conversaSelecionada && conversaAtual ? (
            <>
              {/* Cabeçalho do Chat - FIXO */}
              <div className="flex-shrink-0 border-b border-gray-200 p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {/* Usar inicial do nome do prospect se disponível, senão usar da conversa */}
                      {prospectInfo && (prospectInfo.nome || prospectInfo.nome_completo)
                        ? (prospectInfo.nome || prospectInfo.nome_completo || 'SN')
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                        : conversaAtual.avatar}
                    </div>
                    <div>
                      {/* Priorizar nome do prospect sobre o nome da conversa */}
                      <h3 className="font-semibold text-gray-900">
                        {prospectInfo && (prospectInfo.nome || prospectInfo.nome_completo)
                          ? prospectInfo.nome || prospectInfo.nome_completo
                          : conversaAtual.nome}
                      </h3>
                      <p className="text-sm text-gray-600">{conversaAtual.telefone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conversaDetalhes?.bloqueado && (
                      <Badge variant="danger" className="text-xs">
                        <Ban className="w-3 h-3 inline mr-1" />
                        Bloqueado
                      </Badge>
                    )}
                    <Badge variant={getStatusColor(conversaAtual.status)}>
                      {conversaAtual.status}
                    </Badge>
                  </div>
                </div>

                {/* Botões de Ação no Header */}
                {conversaSelecionada && conversaDetalhes && (
                  <div className="flex items-center gap-2">
                    {/* Botão Transferir */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowTransferirModal(true)}
                      className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                      title="Transferir conversa"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Transferir</span>
                    </Button>

                    {/* Botão Encerrar */}
                    {conversaDetalhes.status_conversa !== 'encerrada' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          if (!confirm('Tem certeza que deseja encerrar esta conversa?')) return

                          try {
                            const response = await fetch('/api/conversas/encerrar', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                conversa_id: conversaSelecionada,
                              }),
                            })

                            const data = await response.json()

                            if (!response.ok) {
                              throw new Error(data.error || 'Erro ao encerrar conversa')
                            }

                            // Atualizar conversaDetalhes
                            setConversaDetalhes({
                              ...conversaDetalhes,
                              status_conversa: 'encerrada',
                            })

                            // Recarregar conversas
                            await fetchConversas()
                          } catch (error: any) {
                            console.error('Erro ao encerrar conversa:', error)
                            alert('Erro ao encerrar conversa: ' + error.message)
                          }
                        }}
                        className="!bg-orange-100 hover:!bg-orange-200 !text-orange-700"
                        title="Encerrar conversa"
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Encerrar</span>
                      </Button>
                    ) : (
                      /* Botão Reabrir */
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          if (!confirm('Tem certeza que deseja reabrir esta conversa?')) return

                          try {
                            const response = await fetch('/api/conversas/reabrir', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                conversa_id: conversaSelecionada,
                              }),
                            })

                            const data = await response.json()

                            if (!response.ok) {
                              throw new Error(data.error || 'Erro ao reabrir conversa')
                            }

                            // Atualizar conversaDetalhes
                            setConversaDetalhes({
                              ...conversaDetalhes,
                              status_conversa: 'ativa',
                            })

                            // Recarregar conversas
                            await fetchConversas()
                          } catch (error: any) {
                            console.error('Erro ao reabrir conversa:', error)
                            alert('Erro ao reabrir conversa: ' + error.message)
                          }
                        }}
                        className="!bg-green-100 hover:!bg-green-200 !text-green-700"
                        title="Reabrir conversa"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Reabrir</span>
                      </Button>
                    )}

                    {/* Botão Bloquear/Desbloquear */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        const action = conversaDetalhes.bloqueado ? 'desbloquear' : 'bloquear'
                        const confirmMessage = conversaDetalhes.bloqueado
                          ? 'Tem certeza que deseja desbloquear este contato?'
                          : 'Tem certeza que deseja bloquear este contato?\n\nAs mensagens bloqueadas não aparecerão nas filas.'

                        if (!confirm(confirmMessage)) return

                        try {
                          const motivo = conversaDetalhes.bloqueado
                            ? undefined
                            : prompt('Motivo do bloqueio (opcional):') || undefined

                          const response = await fetch(`/api/conversas/bloquear?action=${action}`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              conversa_id: conversaSelecionada,
                              motivo,
                            }),
                          })

                          const data = await response.json()

                          if (!response.ok) {
                            throw new Error(data.error || 'Erro ao bloquear/desbloquear')
                          }

                          // Atualizar conversaDetalhes
                          setConversaDetalhes({
                            ...conversaDetalhes,
                            bloqueado: action === 'bloquear',
                            motivo_bloqueio: action === 'bloquear' ? motivo : undefined,
                            data_bloqueio: action === 'bloquear' ? new Date().toISOString() : undefined,
                          })

                          // Recarregar conversas e mensagens
                          await fetchConversas()
                          await refetchMensagens()
                        } catch (error: any) {
                          console.error('Erro ao bloquear/desbloquear:', error)
                          alert('Erro ao bloquear/desbloquear: ' + error.message)
                        }
                      }}
                      className={
                        conversaDetalhes.bloqueado
                          ? '!bg-green-100 hover:!bg-green-200 !text-green-700'
                          : '!bg-red-100 hover:!bg-red-200 !text-red-700'
                      }
                      title={conversaDetalhes.bloqueado ? 'Desbloquear contato' : 'Bloquear contato'}
                    >
                      {conversaDetalhes.bloqueado ? (
                        <>
                          <Unlock className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1">Desbloquear</span>
                        </>
                      ) : (
                        <>
                          <Ban className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1">Bloquear</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Mensagens - ÁREA ROLÁVEL */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0">
                {loadingMensagens ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                  </div>
                ) : mensagens.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-600">Nenhuma mensagem ainda</p>
                    <p className="text-xs text-gray-500 mt-1">Inicie a conversa enviando uma mensagem</p>
                  </div>
                ) : (
                  mensagens.map((mensagem) => {
                    // Mensagens do cliente ficam à esquerda (justify-start)
                    // Mensagens de robo/humano/agente ficam à direita (justify-end)
                    const remetenteLower = (mensagem.remetente || '').toLowerCase()
                    const isCliente = remetenteLower === 'usuario' || remetenteLower === 'cliente'
                    // Todos os outros (robo, bot, humano, agente) ficam à direita automaticamente
                    
                    // Função para obter ícone do remetente
                    const getRemetenteIcon = () => {
                      if (remetenteLower === 'robo' || remetenteLower === 'bot') {
                        return <Bot className="w-4 h-4" />
                      }
                      if (remetenteLower === 'humano') {
                        return <UserCheck className="w-4 h-4" />
                      }
                      if (remetenteLower === 'agente') {
                        return <UserCog className="w-4 h-4" />
                      }
                      if (isCliente) {
                        return <User className="w-4 h-4" />
                      }
                      return null
                    }
                    
                    // Função para obter cor do balão baseado no remetente
                    const getMensagemBgColor = () => {
                      if (remetenteLower === 'robo' || remetenteLower === 'bot') {
                        return 'bg-purple-300 text-gray-900' // Roxo claro para robô
                      }
                      if (remetenteLower === 'humano') {
                        return 'bg-green-300 text-gray-900' // Verde claro para humano
                      }
                      if (remetenteLower === 'agente') {
                        return 'bg-gray-500 text-white' // Cinza para agente (padrão)
                      }
                      // Cliente usa branco
                      return 'bg-white border border-gray-200 text-gray-900'
                    }
                    
                    // Função para obter cor do ícone do remetente
                    const getIconBgColor = () => {
                      if (remetenteLower === 'robo' || remetenteLower === 'bot') {
                        return 'bg-purple-400 text-white' // Roxo para ícone do robô
                      }
                      if (remetenteLower === 'humano') {
                        return 'bg-green-400 text-white' // Verde para ícone do humano
                      }
                      if (remetenteLower === 'agente') {
                        return 'bg-gray-600 text-white' // Cinza para agente
                      }
                      return 'bg-gray-300 text-gray-700' // Cliente
                    }
                    
                    const dataMensagem = mensagem.timestamp || mensagem.created_at
                    const horaFormatada = formatTime(dataMensagem)
                    const remetenteIcon = getRemetenteIcon()
                    const mensagemBgColor = getMensagemBgColor()
                    const iconBgColor = getIconBgColor()

                    return (
                      <div
                        key={mensagem.id}
                        className={`flex items-end gap-2 ${isCliente ? 'justify-start' : 'justify-end'}`}
                      >
                        {/* Ícone do cliente à esquerda */}
                        {isCliente && remetenteIcon && (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1 ${iconBgColor}`}>
                            {remetenteIcon}
                          </div>
                        )}
                        
                        {/* Balão de mensagem */}
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${mensagemBgColor}`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{mensagem.conteudo}</p>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span
                              className={`text-xs ${
                                isCliente 
                                  ? 'text-gray-500' 
                                  : (remetenteLower === 'robo' || remetenteLower === 'bot' || remetenteLower === 'humano')
                                    ? 'text-gray-700'
                                    : 'text-gray-100'
                              }`}
                            >
                              {horaFormatada}
                            </span>
                            {/* Ícone do remetente dentro da mensagem do sistema */}
                            {!isCliente && remetenteIcon && (
                              <div className={`flex-shrink-0 ${
                                remetenteLower === 'robo' || remetenteLower === 'bot' || remetenteLower === 'humano'
                                  ? 'text-gray-700'
                                  : 'text-gray-100'
                              }`}>
                                {remetenteIcon}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Ícone do sistema à direita */}
                        {!isCliente && remetenteIcon && (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1 ${iconBgColor}`}>
                            {remetenteIcon}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
                
                {/* Indicador de digitação */}
                {clienteDigitando && (
                  <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 italic">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span>Atendente está digitando...</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Respostas Automáticas Educacionais */}
              {conversaSelecionada && faculdadeSelecionada && mensagens.length > 0 && (
                <div className="px-4 pb-2">
                  <RespostasAutomaticas
                    ultimaMensagem={mensagens[mensagens.length - 1]?.conteudo || ''}
                    remetente={mensagens[mensagens.length - 1]?.remetente || ''}
                    prospect={prospectInfo}
                    faculdadeId={faculdadeSelecionada.id}
                    onSelecionarResposta={(resposta) => {
                      setNovaMensagem(resposta)
                      textareaRef.current?.focus()
                    }}
                    autoMostrar={!iaPausada} // Só mostrar se IA não estiver pausada
                  />
                </div>
              )}

              {/* Sugestões de Scripts Contextuais */}
              {conversaSelecionada && faculdadeSelecionada && conversaDetalhes && mensagens.length > 0 && (
                <div className="px-4 pb-2">
                  <ScriptSuggestions
                    ultimaMensagem={mensagens[mensagens.length - 1]?.conteudo || ''}
                    faculdadeId={faculdadeSelecionada.id}
                    setor={conversaDetalhes.setor}
                    prospectInfo={prospectInfo}
                    onSelecionarScript={(script) => {
                      setNovaMensagem(script)
                      textareaRef.current?.focus()
                    }}
                  />
                </div>
              )}

              {/* Campo de Envio Melhorado - FIXO NO FINAL */}
              <div className="flex-shrink-0 border-t border-gray-200 bg-white">
                {/* Ações Rápidas */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="template-menu">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setShowTemplates(!showTemplates)
                          setShowCursos(false)
                        }}
                        className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                        title="Templates de mensagens"
                      >
                        <Zap className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Templates</span>
                      </Button>
                    </div>
                    
                    <div className="relative cursos-menu">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setShowCursos(!showCursos)
                          setShowTemplates(false)
                          setShowBaseConhecimento(false)
                        }}
                        className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                        title="Listar cursos"
                        disabled={!faculdadeSelecionada}
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Listar Cursos</span>
                      </Button>
                      
                      {/* Menu de Cursos */}
                      {showCursos && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 min-w-[250px] max-w-[400px] max-h-[400px] overflow-y-auto">
                          {loadingCursos ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                              <span className="ml-2 text-sm text-gray-600">Carregando...</span>
                            </div>
                          ) : cursos.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              {!faculdadeSelecionada 
                                ? 'Selecione uma faculdade primeiro'
                                : 'Nenhum curso encontrado'}
                            </div>
                          ) : (
                            <>
                              <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Cursos Disponíveis:</div>
                              <div className="space-y-1">
                                {cursos.map((curso) => (
                                  <button
                                    key={curso.id}
                                    onClick={() => handleSelectCurso(curso)}
                                    className="flex items-start gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded border border-gray-200 transition-colors text-left text-gray-700"
                                  >
                                    <GraduationCap className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">{curso.curso}</div>
                                      {curso.modalidade && (
                                        <div className="text-xs text-gray-500">{curso.modalidade}</div>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="relative anexo-menu">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowAnexos(!showAnexos)}
                        className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                        title="Anexar arquivo"
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      
                      {/* Menu de Anexos */}
                      {showAnexos && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20">
                          <button
                            onClick={() => handleAnexoClick('image')}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded text-gray-700"
                          >
                            <Image className="w-4 h-4" />
                            <span>Imagem</span>
                          </button>
                          <button
                            onClick={() => handleAnexoClick('file')}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 rounded text-gray-700"
                          >
                            <File className="w-4 h-4" />
                            <span>Documento</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="relative base-conhecimento-menu">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setShowBaseConhecimento(!showBaseConhecimento)
                          setShowTemplates(false)
                          setShowCursos(false)
                          setShowAnexos(false)
                        }}
                        className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                        title="Buscar na base de conhecimento"
                        disabled={!faculdadeSelecionada}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Base Conhecimento</span>
                      </Button>

                      {/* Dropdown Base de Conhecimento */}
                      {showBaseConhecimento && faculdadeSelecionada && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20 min-w-[400px] max-w-[500px] max-h-[500px] overflow-y-auto">
                          <SugestoesBase
                            query={mensagens.length > 0 ? mensagens[mensagens.length - 1]?.conteudo || '' : ''}
                            faculdadeId={faculdadeSelecionada.id}
                            onSelecionarSugestao={(resposta) => {
                              setNovaMensagem(resposta)
                              setShowBaseConhecimento(false)
                              textareaRef.current?.focus()
                            }}
                            autoBuscar={false}
                            limite={5}
                          />
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleMarcarComoLida}
                      className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                      title="Marcar como lida"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handlePausarIA}
                      className={iaPausada 
                        ? "!bg-orange-100 hover:!bg-orange-200 !text-orange-700 border border-orange-300" 
                        : "!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                      }
                      title={iaPausada ? "Retomar IA" : "Pausar IA"}
                    >
                      {iaPausada ? (
                        <>
                          <Play className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1">Retomar IA</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1">Pausar IA</span>
                        </>
                      )}
                    </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowAgendarModal(true)}
                        className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                        title="Agendar mensagem"
                        disabled={!conversaSelecionada}
                      >
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Agendar</span>
                      </Button>
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (conversaDetalhes) {
                            exportarConversaTXT({
                              conversa: conversaDetalhes,
                              mensagens,
                              prospect: prospectInfo,
                            })
                          }
                        }}
                        className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                        title="Exportar conversa"
                        disabled={!conversaDetalhes}
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Exportar</span>
                      </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {novaMensagem.length > 0 && `${novaMensagem.length} caracteres`}
                  </div>
                </div>
                
                {/* Templates Dropdown */}
                {showTemplates && (
                  <div className="template-menu px-4 py-2 bg-gray-50 border-b border-gray-200 max-h-48 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Mensagens Rápidas:</div>
                    <div className="grid grid-cols-1 gap-1">
                      {templatesMensagens.map((template, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectTemplate(template)}
                          className="text-left px-3 py-2 text-sm bg-white hover:bg-gray-100 rounded border border-gray-200 transition-colors text-gray-700"
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Área de Input Melhorada */}
                <div className="p-4">
                  <div className="flex items-end gap-2">
                    {/* Botão Emoji (placeholder) */}
                    <button
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Emojis (em breve)"
                      disabled
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    
                    {/* Textarea Grande */}
                    <div className="flex-1 relative">
                      <textarea
                        ref={textareaRef}
                        value={novaMensagem}
                        onChange={(e) => {
                          setNovaMensagem(e.target.value)
                          // Indicar que está digitando
                          if (!isTypingLocal && e.target.value.trim()) {
                            setIsTypingLocal(true)
                            setClienteDigitando(true)
                          } else if (isTypingLocal && !e.target.value.trim()) {
                            setIsTypingLocal(false)
                            setClienteDigitando(false)
                          }
                        }}
                        onKeyDown={(e) => {
                          handleKeyPress(e)
                          // Quando enviar, parar de indicar digitação
                          if (e.key === 'Enter' && !e.shiftKey) {
                            setIsTypingLocal(false)
                            setClienteDigitando(false)
                          }
                        }}
                        onBlur={() => {
                          // Parar de indicar quando sair do campo
                          setIsTypingLocal(false)
                          setClienteDigitando(false)
                        }}
                        placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
                        rows={1}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent resize-none overflow-y-auto !bg-white !text-black placeholder:text-gray-400 min-h-[60px] max-h-[200px]"
                        style={{ minHeight: '60px' }}
                      />
                      
                      {/* Contador de caracteres (se necessário) */}
                      {novaMensagem.length > 1000 && (
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                          {novaMensagem.length}/4096
                        </div>
                      )}
                    </div>
                    
                    {/* Botão Enviar */}
                    <Button 
                      onClick={handleEnviarMensagem}
                      disabled={!novaMensagem.trim()}
                      className="!bg-gray-900 hover:!bg-gray-800 disabled:!bg-gray-300 disabled:!cursor-not-allowed h-[60px] px-6"
                      title="Enviar mensagem (Enter)"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {/* Dica de atalho */}
                  <div className="mt-2 text-xs text-gray-400">
                    <span>💡 Pressione Enter para enviar, Shift+Enter para nova linha</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Selecione uma conversa</h3>
                <p className="text-gray-600">Clique em uma conversa ao lado para começar</p>
              </div>
            </div>
          )}
        </div>

        {/* COLUNA 3: Informações do Lead */}
        <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col">
          {conversaSelecionada && conversaAtual ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações do Lead
                </h3>
                {mensagens.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowMetricasModal(true)}
                    className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                    title="Ver métricas da conversa"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingProspect ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
                  </div>
                ) : prospectInfo ? (
                  <>
                    {/* Dados Pessoais */}
                    <Card className="bg-white">
                      <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Dados Pessoais
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Nome:</span>
                          <p className="font-medium text-gray-900">{prospectInfo.nome || prospectInfo.nome_completo || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">{conversaAtual.telefone}</span>
                        </div>
                        {prospectInfo.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-900">{prospectInfo.email}</span>
                          </div>
                        )}
                        {prospectInfo.cpf && (
                          <div>
                            <span className="text-gray-600">CPF:</span>
                            <p className="text-gray-900">{prospectInfo.cpf}</p>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Curso e Status */}
                    <Card className="bg-white">
                      <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Curso e Status
                      </h4>
                      <div className="space-y-2 text-sm">
                        {prospectInfo.curso && (
                          <div>
                            <span className="text-gray-600">Curso:</span>
                            <p className="font-medium text-gray-900">{prospectInfo.curso}</p>
                          </div>
                        )}
                        {prospectInfo.curso_pretendido && (
                          <div>
                            <span className="text-gray-600">Pretendido:</span>
                            <p className="text-gray-900">{prospectInfo.curso_pretendido}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <div className="mt-1">
                            <Badge variant={getStatusColor(prospectInfo.status_academico || 'novo')}>
                              {prospectInfo.status_academico || 'Novo'}
                            </Badge>
                          </div>
                        </div>
                        {prospectInfo.turno && (
                          <div>
                            <span className="text-gray-600">Turno:</span>
                            <p className="text-gray-900 capitalize">{prospectInfo.turno}</p>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Financeiro */}
                    {(prospectInfo.valor_mensalidade || prospectInfo.nota_qualificacao) && (
                      <Card className="bg-white">
                        <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Financeiro
                        </h4>
                        <div className="space-y-2 text-sm">
                          {prospectInfo.valor_mensalidade && (
                            <div>
                              <span className="text-gray-600">Mensalidade:</span>
                              <p className="font-medium text-green-600">
                                R$ {Number(prospectInfo.valor_mensalidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          )}
                          {prospectInfo.nota_qualificacao !== undefined && (
                            <div>
                              <span className="text-gray-600">Nota:</span>
                              <p className="font-medium text-gray-900">{prospectInfo.nota_qualificacao}/100</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    {/* Endereço */}
                    {(prospectInfo.cep || prospectInfo.cidade || prospectInfo.estado) && (
                      <Card className="bg-white">
                        <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Localização
                        </h4>
                        <div className="space-y-1 text-sm">
                          {prospectInfo.cep && (
                            <p className="text-gray-900">CEP: {prospectInfo.cep}</p>
                          )}
                          {prospectInfo.endereco && (
                            <p className="text-gray-900">
                              {prospectInfo.endereco}
                              {prospectInfo.numero && `, ${prospectInfo.numero}`}
                              {prospectInfo.complemento && ` - ${prospectInfo.complemento}`}
                            </p>
                          )}
                          {prospectInfo.bairro && (
                            <p className="text-gray-900">Bairro: {prospectInfo.bairro}</p>
                          )}
                          {(prospectInfo.cidade || prospectInfo.estado) && (
                            <p className="text-gray-900">
                              {prospectInfo.cidade || ''}{prospectInfo.cidade && prospectInfo.estado ? ' - ' : ''}{prospectInfo.estado || ''}
                            </p>
                          )}
                        </div>
                      </Card>
                    )}

                    {/* Datas */}
                    <Card className="bg-white">
                      <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Histórico
                      </h4>
                      <div className="space-y-2 text-sm">
                        {prospectInfo.created_at && (
                          <div>
                            <span className="text-gray-600">Cadastro:</span>
                            <p className="text-gray-900">
                              {mounted ? formatDate(prospectInfo.created_at) : '...'}
                            </p>
                          </div>
                        )}
                        {prospectInfo.ultimo_contato && (
                          <div>
                            <span className="text-gray-600">Último contato:</span>
                            <p className="text-gray-900">
                              {mounted ? formatDate(prospectInfo.ultimo_contato) : '...'}
                            </p>
                          </div>
                        )}
                        {prospectInfo.data_matricula && (
                          <div>
                            <span className="text-gray-600">Matrícula:</span>
                            <p className="font-medium text-green-600">
                              {mounted ? formatDate(prospectInfo.data_matricula) : '...'}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Tags */}
                    {conversaDetalhes && faculdadeSelecionada && (
                      <Card className="bg-white">
                        <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Tags
                        </h4>
                        <TagsManager
                          tagsAtuais={conversaDetalhes.tags || []}
                          conversaId={conversaSelecionada}
                          faculdadeId={faculdadeSelecionada.id}
                          setor={conversaDetalhes.setor}
                          onTagsChanged={async (novasTags) => {
                            // Atualizar conversaDetalhes localmente
                            if (conversaDetalhes) {
                              setConversaDetalhes({
                                ...conversaDetalhes,
                                tags: novasTags,
                              })
                            }
                            // Recarregar lista de conversas para atualizar tags na lista
                            await fetchConversas()
                          }}
                        />
                      </Card>
                    )}

                    {/* Anotações Internas */}
                    {conversaSelecionada && faculdadeSelecionada && (
                      <AnotacoesPanel
                        conversaId={conversaSelecionada}
                        faculdadeId={faculdadeSelecionada.id}
                        usuarioAtual={{
                          id: 'current-user-id', // TODO: Obter do contexto de autenticação
                          nome: 'Atendente', // TODO: Obter do contexto de autenticação
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 px-4">
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Lead não encontrado</h4>
                    <p className="text-xs text-gray-600">
                      Este contato ainda não possui cadastro como prospect
                    </p>
                  </div>
                )}

                {/* Tags e Anotações mesmo sem prospect */}
                {conversaSelecionada && conversaDetalhes && faculdadeSelecionada && !prospectInfo && (
                  <>
                    <Card className="bg-white">
                      <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Tags
                      </h4>
                      <TagsManager
                        tagsAtuais={conversaDetalhes.tags || []}
                        conversaId={conversaSelecionada}
                        faculdadeId={faculdadeSelecionada.id}
                        setor={conversaDetalhes.setor}
                        onTagsChanged={async (novasTags) => {
                          if (conversaDetalhes) {
                            setConversaDetalhes({
                              ...conversaDetalhes,
                              tags: novasTags,
                            })
                          }
                          await fetchConversas()
                        }}
                      />
                    </Card>

                    {/* Timeline de Interações */}
                    {conversaDetalhes && (
                      <TimelineProspect
                        prospectId={conversaDetalhes.prospect_id || null}
                        telefone={conversaDetalhes.telefone || null}
                        faculdadeId={faculdadeSelecionada.id}
                        conversaAtualId={conversaSelecionada}
                      />
                    )}

                    <AnotacoesPanel
                      conversaId={conversaSelecionada}
                      faculdadeId={faculdadeSelecionada.id}
                      usuarioAtual={{
                        id: 'current-user-id',
                        nome: 'Atendente',
                      }}
                    />
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600">Selecione uma conversa para ver as informações do lead</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Transferência */}
      {faculdadeSelecionada && conversaSelecionada && conversaDetalhes && (
        <TransferirModal
          isOpen={showTransferirModal}
          onClose={() => setShowTransferirModal(false)}
          conversaId={conversaSelecionada}
          faculdadeId={faculdadeSelecionada.id}
          setorAtual={conversaDetalhes.setor}
          atendenteAtual={conversaDetalhes.atendente}
          onTransferir={handleTransferirSucesso}
        />
      )}

      {/* Modal de Métricas */}
      {conversaSelecionada && (
        <MetricasModal
          isOpen={showMetricasModal}
          onClose={() => setShowMetricasModal(false)}
          conversaId={conversaSelecionada}
          mensagens={mensagens}
          conversaDetalhes={conversaDetalhes}
        />
      )}

      {/* Modal de Agendar Mensagem */}
      {faculdadeSelecionada && conversaSelecionada && conversaDetalhes && (
        <AgendarMensagem
          isOpen={showAgendarModal}
          onClose={() => setShowAgendarModal(false)}
          conversaId={conversaSelecionada}
          telefone={conversaDetalhes.telefone}
          nomeContato={conversaAtual?.nome || conversaDetalhes.nome}
          faculdadeId={faculdadeSelecionada.id}
          onAgendar={handleAgendarMensagem}
        />
      )}
    </div>
  )
}
