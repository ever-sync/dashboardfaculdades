'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { ConversaWhatsApp, Mensagem } from '@/types/supabase'
import { Send, Paperclip, MoreVertical, Phone, Video } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ChatWindowProps {
    conversa: ConversaWhatsApp
}

export function ChatWindow({ conversa }: ChatWindowProps) {
    const [mensagens, setMensagens] = useState<Mensagem[]>([])
    const [loading, setLoading] = useState(true)
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchMensagens()

        // Inscrever para novas mensagens nesta conversa
        const channel = supabase
            .channel(`chat:${conversa.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mensagens',
                    filter: `conversa_id=eq.${conversa.id}`
                },
                (payload) => {
                    setMensagens(prev => [...prev, payload.new as Mensagem])
                    scrollToBottom()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversa.id])

    const fetchMensagens = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('mensagens')
                .select('*')
                .eq('conversa_id', conversa.id)
                .order('created_at', { ascending: true })

            if (error) throw error
            setMensagens(data || [])
            scrollToBottom()

            // Marcar como lida
            if (conversa.nao_lidas && conversa.nao_lidas > 0) {
                await supabase
                    .from('conversas_whatsapp')
                    .update({ nao_lidas: 0 })
                    .eq('id', conversa.id)
            }
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error)
        } finally {
            setLoading(false)
        }
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        try {
            // 1. Enviar via Evolution API (backend proxy)
            const res = await fetch('/api/evolution/message/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversa_id: conversa.id,
                    content: newMessage,
                    type: 'text'
                })
            })

            if (!res.ok) {
                throw new Error('Falha ao enviar mensagem')
            }

            // 2. A mensagem será inserida no banco pelo webhook ou pela resposta da API
            // Por enquanto, vamos inserir otimisticamente ou esperar o reload
            // Se a API retornar a mensagem criada, adicionamos aqui

            setNewMessage('')
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error)
            alert('Erro ao enviar mensagem. Tente novamente.')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#efe7dd]">
            {/* Header */}
            <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-semibold">
                        {conversa.nome?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            {conversa.nome || conversa.telefone}
                        </h2>
                        <p className="text-xs text-gray-500">
                            {conversa.telefone}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 text-gray-600">
                    <button className="hover:bg-gray-100 p-2 rounded-full"><Video className="w-5 h-5" /></button>
                    <button className="hover:bg-gray-100 p-2 rounded-full"><Phone className="w-5 h-5" /></button>
                    <button className="hover:bg-gray-100 p-2 rounded-full"><MoreVertical className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                    </div>
                ) : mensagens.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-gray-500 text-sm bg-white/50 rounded-lg p-4 mx-auto max-w-md text-center shadow-sm">
                        Esta é uma nova conversa. Envie uma mensagem para começar.
                    </div>
                ) : (
                    mensagens.map((msg) => {
                        const isMe = msg.remetente === 'agente' || msg.remetente === 'bot'
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg p-3 shadow-sm relative ${isMe
                                        ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none'
                                        : 'bg-white text-gray-900 rounded-tl-none'
                                        }`}
                                >
                                    {msg.tipo_mensagem === 'imagem' && msg.midia_url ? (
                                        <div className="mb-2">
                                            <img
                                                src={msg.midia_url}
                                                alt={msg.conteudo || 'Imagem'}
                                                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => window.open(msg.midia_url, '_blank')}
                                            />
                                            {msg.conteudo && msg.conteudo !== 'Imagem' && (
                                                <p className="text-sm mt-1">{msg.conteudo}</p>
                                            )}
                                        </div>
                                    ) : msg.tipo_mensagem === 'video' && msg.midia_url ? (
                                        <div className="mb-2">
                                            <video
                                                src={msg.midia_url}
                                                controls
                                                className="max-w-full rounded-lg"
                                            />
                                            {msg.conteudo && msg.conteudo !== 'Vídeo' && (
                                                <p className="text-sm mt-1">{msg.conteudo}</p>
                                            )}
                                        </div>
                                    ) : msg.tipo_mensagem === 'audio' && msg.midia_url ? (
                                        <div className="flex items-center gap-2 min-w-[200px]">
                                            <audio src={msg.midia_url} controls className="w-full" />
                                        </div>
                                    ) : msg.tipo_mensagem === 'documento' && msg.midia_url ? (
                                        <a
                                            href={msg.midia_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <div className="bg-white p-2 rounded-full">
                                                <Paperclip className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-sm font-medium truncate">{msg.conteudo || 'Documento'}</p>
                                                <p className="text-xs text-gray-500">Clique para baixar</p>
                                            </div>
                                        </a>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.conteudo}</p>
                                    )}
                                    <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'justify-end text-gray-500' : 'text-gray-400'}`}>
                                        {format(new Date(msg.created_at), 'HH:mm')}
                                        {isMe && (
                                            <span>
                                                {msg.lida ? '✓✓' : '✓'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div >

            {/* Input Area */}
            < div className="bg-white p-3 border-t border-gray-200" >
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2 focus-within:ring-1 focus-within:ring-gray-300 focus-within:bg-white transition-all">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Digite uma mensagem"
                            className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 text-sm"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage(e)
                                }
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className={`p-3 rounded-full transition-colors ${!newMessage.trim() || sending
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-[#00a884] text-white hover:bg-[#008f6f]'
                            }`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div >
        </div >
    )
}
