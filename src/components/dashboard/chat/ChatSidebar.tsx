'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ConversaWhatsApp } from '@/types/supabase'
import { Search, User, Circle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ChatSidebarProps {
    onSelectConversa: (conversa: ConversaWhatsApp) => void
    selectedConversaId?: string
}

export function ChatSidebar({ onSelectConversa, selectedConversaId }: ChatSidebarProps) {
    const [conversas, setConversas] = useState<ConversaWhatsApp[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchConversas()

        // Inscrever para atualizações em tempo real
        const channel = supabase
            .channel('conversas_list')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversas_whatsapp'
                },
                (payload) => {
                    // Recarregar lista completa para garantir ordem correta
                    // Otimização futura: atualizar apenas o item afetado
                    fetchConversas()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchConversas = async () => {
        try {
            const { data, error } = await supabase
                .from('conversas_whatsapp')
                .select('*')
                .order('updated_at', { ascending: false })

            if (error) throw error
            setConversas(data || [])
        } catch (error) {
            console.error('Erro ao buscar conversas:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredConversas = conversas.filter(c =>
        c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefone?.includes(searchTerm)
    )

    return (
        <div className="flex flex-col h-full border-r border-gray-200 bg-white w-80">
            <div className="p-4 border-b border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar conversa..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredConversas.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        Nenhuma conversa encontrada
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredConversas.map((conversa) => (
                            <button
                                key={conversa.id}
                                onClick={() => onSelectConversa(conversa)}
                                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${selectedConversaId === conversa.id ? 'bg-blue-50 hover:bg-blue-50' : ''
                                    }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                        <User className="w-6 h-6" />
                                    </div>
                                    {conversa.nao_lidas && conversa.nao_lidas > 0 ? (
                                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                            {conversa.nao_lidas}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                                            {conversa.nome || conversa.telefone}
                                        </h3>
                                        <span className="text-xs text-gray-400 flex-shrink-0">
                                            {conversa.updated_at && formatDistanceToNow(new Date(conversa.updated_at), {
                                                addSuffix: false,
                                                locale: ptBR
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">
                                        {conversa.ultima_mensagem || 'Nova conversa'}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
