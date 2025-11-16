'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MessageSquare, Search, User, Clock, Send } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
interface ConversaWhatsApp {
  id: string
  nome: string
  telefone: string
  ultima_mensagem?: string
  data_ultima_mensagem: string
  status: string
  nao_lidas?: number
  faculdade_id?: string
  cliente_id?: string
}

interface Conversa {
  id: string
  nome: string
  telefone: string
  ultimaMensagem: string
  hora: string
  status: 'ativo' | 'pendente' | 'finalizado'
  naoLidas: number
  avatar: string
}

export default function ConversasPage() {
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [novaMensagem, setNovaMensagem] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20
  const { faculdadeSelecionada } = useFaculdade()

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
        .eq('cliente_id', faculdadeSelecionada.id)

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
        .select('id, nome, telefone, ultima_mensagem, data_ultima_mensagem, status, nao_lidas, cliente_id')
        .eq('cliente_id', faculdadeSelecionada.id)
        .order('data_ultima_mensagem', { ascending: false })
        .range(startIndex, startIndex + itemsPerPage - 1)

      if (error) {
        console.warn('Erro ao buscar conversas do Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        setConversas([])
        return
      }

      const conversasFormatadas: Conversa[] = (data || []).map((c: ConversaWhatsApp) => ({
        id: c.id,
        nome: c.nome || 'Sem nome',
        telefone: c.telefone || 'Não informado',
        ultimaMensagem: c.ultima_mensagem || 'Sem mensagens',
        hora: c.data_ultima_mensagem ? new Date(c.data_ultima_mensagem).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : 'N/A',
        status: (c.status === 'encerrado' ? 'finalizado' : (c.status || 'ativo')) as 'ativo' | 'pendente' | 'finalizado',
        naoLidas: c.nao_lidas || 0,
        avatar: c.nome ? c.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase() : '?'
      }))

      setConversas(conversasFormatadas)
    } catch (error: any) {
      console.warn('Erro inesperado ao buscar conversas:', error?.message || error)
      setConversas([])
    } finally {
      setLoading(false)
    }
  }, [faculdadeSelecionada, currentPage, itemsPerPage])

  useEffect(() => {
    if (faculdadeSelecionada) fetchConversas()
  }, [faculdadeSelecionada, currentPage, fetchConversas])

  // Hooks devem ser chamados antes de qualquer early return
  const conversasFiltradas = useMemo(() => {
    return conversas.filter(conversa => {
      const matchSearch = conversa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversa.ultimaMensagem.toLowerCase().includes(searchTerm.toLowerCase())
      const matchStatus = statusFilter === 'todos' || conversa.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [conversas, searchTerm, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'success'
      case 'pendente': return 'warning'
      case 'finalizado': return 'info'
      default: return 'info'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Header
          title="Conversas"
          subtitle="Gerencie conversas do WhatsApp"
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  const enviarMensagem = () => {
    if (novaMensagem.trim() && conversaSelecionada) {
      // Aqui você implementaria o envio real da mensagem
      console.log('Enviar mensagem:', novaMensagem, 'para conversa:', conversaSelecionada)
      setNovaMensagem('')
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Header
        title="Conversas"
        subtitle="Gerencie conversas do WhatsApp"
      />
      
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Conversas */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              {/* Filtros e Busca */}
              <div className="space-y-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar conversas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-gray-800 dark:text-gray-200"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'todos' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setStatusFilter('todos')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={statusFilter === 'ativo' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setStatusFilter('ativo')}
                  >
                    Ativos
                  </Button>
                  <Button
                    variant={statusFilter === 'pendente' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setStatusFilter('pendente')}
                  >
                    Pendentes
                  </Button>
                </div>
              </div>
              
              {/* Lista de Conversas */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {conversasFiltradas.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {searchTerm || statusFilter !== 'todos' ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm || statusFilter !== 'todos' 
                        ? 'Tente ajustar seus filtros de busca' 
                        : 'As conversas aparecerão aqui assim que forem iniciadas'}
                    </p>
                  </div>
                ) : (
                  conversasFiltradas.map((conversa) => (
                    <div
                      key={conversa.id}
                      onClick={() => setConversaSelecionada(conversa.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        conversaSelecionada === conversa.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      } border`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {conversa.avatar}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm truncate text-gray-800">{conversa.nome}</h4>
                            <span className="text-xs text-gray-600">{conversa.hora}</span>
                          </div>
                          
                          <p className="text-sm text-gray-700 truncate mb-2">
                            {conversa.ultimaMensagem}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant={getStatusColor(conversa.status)}>
                              {conversa.status}
                            </Badge>
                            
                            {conversa.naoLidas > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                {conversa.naoLidas}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Controles de Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} conversas
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-3 text-sm text-gray-700">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
          
          {/* Área de Conversa */}
          <div className="lg:col-span-2">
            {conversaSelecionada ? (
              <Card className="h-full">
                {/* Cabeçalho da Conversa */}
                <div className="border-b pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {conversas.find(c => c.id === conversaSelecionada)?.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{conversas.find(c => c.id === conversaSelecionada)?.nome}</h3>
                      <p className="text-sm text-gray-600">{conversas.find(c => c.id === conversaSelecionada)?.telefone}</p>
                    </div>
                  </div>
                </div>
                
                {/* Mensagens */}
                <div className="flex-1 space-y-4 mb-4 max-h-96 overflow-y-auto">
                  <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-gray-800">Olá! Gostaria de saber mais informações sobre os cursos.</p>
                    <span className="text-xs text-gray-600 mt-1 block">10:25</span>
                  </div>
                  
                  <div className="bg-blue-500 text-white rounded-lg p-3 max-w-xs ml-auto">
                    <p className="text-sm">Olá! Claro, qual curso tem interesse?</p>
                    <span className="text-xs text-blue-100 mt-1 block">10:26</span>
                  </div>
                  
                  <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-gray-800">Gostaria de saber mais sobre o curso de Engenharia</p>
                    <span className="text-xs text-gray-600 mt-1 block">10:30</span>
                  </div>
                </div>
                
                {/* Campo de Envio */}
                <div className="border-t pt-4">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Digite sua mensagem..."
                      value={novaMensagem}
                      onChange={(e) => setNovaMensagem(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
                      className="flex-1"
                    />
                    <Button onClick={enviarMensagem}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Selecione uma conversa</h3>
                  <p className="text-gray-600">Clique em uma conversa ao lado para começar a interagir</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}