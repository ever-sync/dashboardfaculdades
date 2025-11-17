'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { AgenteIA } from '@/types/supabase'
import { Bot, X } from 'lucide-react'

interface AgenteModalProps {
  aberto: boolean
  onClose: () => void
  agente: AgenteIA | null
  modoEdicao: boolean
  onSuccess: () => void
}

export function AgenteModal({
  aberto,
  onClose,
  agente,
  modoEdicao,
  onSuccess,
}: AgenteModalProps) {
  const { faculdadeSelecionada, faculdades } = useFaculdade()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    faculdade_id: '',
    nome: '',
    descricao: '',
    script_atendimento: '',
    setor: '' as 'Suporte' | 'Vendas' | 'Atendimento' | '',
    ativo: true,
  })

  useEffect(() => {
    if (agente && modoEdicao) {
      setFormData({
        faculdade_id: agente.faculdade_id,
        nome: agente.nome,
        descricao: agente.descricao || '',
        script_atendimento: agente.script_atendimento,
        setor: agente.setor || '',
        ativo: agente.ativo,
      })
    } else {
      setFormData({
        faculdade_id: faculdadeSelecionada?.id || '',
        nome: '',
        descricao: '',
        script_atendimento: '',
        setor: '',
        ativo: true,
      })
    }
  }, [agente, modoEdicao, aberto, faculdadeSelecionada])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.faculdade_id) {
      alert('Selecione uma faculdade')
      return
    }

    if (!formData.nome.trim()) {
      alert('O nome do agente é obrigatório')
      return
    }

    if (!formData.setor) {
      alert('Selecione um setor')
      return
    }

    if (!formData.script_atendimento.trim()) {
      alert('O script de atendimento é obrigatório')
      return
    }

    try {
      setLoading(true)

      if (modoEdicao && agente) {
        // Atualizar agente existente
        const { error } = await supabase
          .from('agentes_ia')
          .update({
            faculdade_id: formData.faculdade_id,
            nome: formData.nome,
            descricao: formData.descricao || null,
            script_atendimento: formData.script_atendimento,
            setor: formData.setor || null,
            ativo: formData.ativo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', agente.id)

        if (error) throw error
      } else {
        // Criar novo agente
        const { error } = await supabase
          .from('agentes_ia')
          .insert({
            faculdade_id: formData.faculdade_id,
            nome: formData.nome,
            descricao: formData.descricao || null,
            script_atendimento: formData.script_atendimento,
            setor: formData.setor || null,
            ativo: formData.ativo,
          })

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro ao salvar agente:', error)
      alert('Erro ao salvar agente: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-cyan-600" />
            <div>
              <h2 className="text-xl font-semibold text-black">
                {modoEdicao ? 'Editar Agente' : 'Novo Agente IA'}
              </h2>
              <p className="text-sm text-gray-500">
                {modoEdicao ? 'Atualize as informações do agente' : 'Configure um novo agente de atendimento'}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Faculdade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Faculdade <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.faculdade_id}
                onChange={(e) => setFormData({ ...formData, faculdade_id: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent !text-black !bg-white"
              >
                <option value="">Selecione uma faculdade</option>
                {faculdades.map((faculdade) => (
                  <option key={faculdade.id} value={faculdade.id}>
                    {faculdade.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Setor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Setor <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.setor}
                onChange={(e) => setFormData({ ...formData, setor: e.target.value as 'Suporte' | 'Vendas' | 'Atendimento' })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent !text-black !bg-white"
              >
                <option value="">Selecione um setor</option>
                <option value="Suporte">Suporte</option>
                <option value="Vendas">Vendas</option>
                <option value="Atendimento">Atendimento</option>
              </select>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Agente <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Atendente de Vendas"
                required
                className="!bg-white !text-black"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <Input
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Breve descrição do agente (opcional)"
                className="!bg-white !text-black"
              />
            </div>

            {/* Script de Atendimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Script de Atendimento <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.script_atendimento}
                onChange={(e) => setFormData({ ...formData, script_atendimento: e.target.value })}
                placeholder="Digite o script de atendimento que o agente irá utilizar..."
                required
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none !text-black !bg-white"
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.script_atendimento.length} caracteres
              </p>
            </div>

            {/* Status Ativo */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Agente ativo
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Agentes inativos não serão utilizados no atendimento
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {loading ? 'Salvando...' : modoEdicao ? 'Atualizar' : 'Criar Agente'}
          </Button>
        </div>
      </div>
    </div>
  )
}

