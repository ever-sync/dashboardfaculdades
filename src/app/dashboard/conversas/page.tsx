'use client'

import { useState } from 'react'
import { ChatSidebar } from '@/components/dashboard/chat/ChatSidebar'
import { ChatWindow } from '@/components/dashboard/chat/ChatWindow'
import { ConversaWhatsApp } from '@/types/supabase'
import { MessageSquare } from 'lucide-react'

export default function ConversasPage() {
    const [selectedConversa, setSelectedConversa] = useState<ConversaWhatsApp | null>(null)

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-gray-100 overflow-hidden rounded-lg border border-gray-200 shadow-sm m-4">
            {/* Sidebar */}
            <div className={`${selectedConversa ? 'hidden md:block' : 'w-full'} md:w-80 flex-shrink-0 h-full`}>
                <ChatSidebar
                    onSelectConversa={setSelectedConversa}
                    selectedConversaId={selectedConversa?.id}
                />
            </div>

            {/* Main Content */}
            <div className={`flex-1 h-full ${!selectedConversa ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversa ? (
                    <div className="w-full h-full flex flex-col">
                        {/* Mobile Back Button Header (only visible on mobile) */}
                        <div className="md:hidden bg-white p-2 border-b border-gray-200 flex items-center">
                            <button
                                onClick={() => setSelectedConversa(null)}
                                className="text-blue-600 font-medium text-sm px-2"
                            >
                                ← Voltar
                            </button>
                        </div>
                        <ChatWindow conversa={selectedConversa} />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-8 text-center">
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                            <MessageSquare className="w-12 h-12 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">
                            Suas Conversas
                        </h2>
                        <p className="max-w-md">
                            Selecione uma conversa na lista ao lado para visualizar as mensagens e interagir com seus contatos.
                        </p>
                        <div className="mt-8 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm max-w-md border border-blue-100">
                            <p className="font-semibold mb-1">Dica:</p>
                            <p>Certifique-se de que sua instância da Evolution API esteja conectada e com o webhook configurado para receber mensagens em tempo real.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
