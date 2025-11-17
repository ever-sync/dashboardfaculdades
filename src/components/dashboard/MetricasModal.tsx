'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MetricasConversa } from './MetricasConversa'
import { Mensagem, ConversaWhatsApp } from '@/types/supabase'

interface MetricasModalProps {
  isOpen: boolean
  onClose: () => void
  conversaId: string
  mensagens: Mensagem[]
  conversaDetalhes?: ConversaWhatsApp | null
}

export function MetricasModal({
  isOpen,
  onClose,
  conversaId,
  mensagens,
  conversaDetalhes,
}: MetricasModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Métricas da Conversa</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          <MetricasConversa
            conversaId={conversaId}
            mensagens={mensagens}
            conversaDetalhes={conversaDetalhes}
          />
        </div>
      </div>
    </div>
  )
}
