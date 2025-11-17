'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Curso } from '@/types/supabase'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { X } from 'lucide-react'

interface CursoModalProps {
  curso?: Curso | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CursoModal({ curso, isOpen, onClose, onSuccess }: CursoModalProps) {
  const { faculdadeSelecionada, faculdades } = useFaculdade()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    faculdade_id: '',
    curso: '',
    quantidade_de_parcelas: 1,
    modalidade: 'Presencial' as 'Presencial' | 'EAD' | 'Híbrido',
    duracao: '',
    valor_com_desconto_pontualidade: 0,
    desconto_percentual: 0,
    pratica: false,
    laboratorio: false,
    estagio: false,
    tcc: false,
    link: '',
    descricao: '',
    categoria: '',
    ativo: true,
  })

  // Carregar dados do curso quando for edição
  useEffect(() => {
    if (curso && isOpen) {
      setFormData({
        faculdade_id: curso.faculdade_id || faculdadeSelecionada?.id || '',
        curso: curso.curso || '',
        quantidade_de_parcelas: curso.quantidade_de_parcelas || 1,
        modalidade: curso.modalidade || 'Presencial',
        duracao: curso.duracao || '',
        valor_com_desconto_pontualidade: curso.valor_com_desconto_pontualidade || 0,
        desconto_percentual: curso.desconto_percentual || 0,
        pratica: curso.pratica || false,
        laboratorio: curso.laboratorio || false,
        estagio: curso.estagio || false,
        tcc: curso.tcc || false,
        link: curso.link || '',
        descricao: curso.descricao || '',
        categoria: curso.categoria || '',
        ativo: curso.ativo !== undefined ? curso.ativo : true,
      })
      setError(null)
    } else if (!curso && isOpen) {
      // Reset form para novo curso
      setFormData({
        faculdade_id: faculdadeSelecionada?.id || '',
        curso: '',
        quantidade_de_parcelas: 1,
        modalidade: 'Presencial',
        duracao: '',
        valor_com_desconto_pontualidade: 0,
        desconto_percentual: 0,
        pratica: false,
        laboratorio: false,
        estagio: false,
        tcc: false,
        link: '',
        descricao: '',
        categoria: '',
        ativo: true,
      })
      setError(null)
    }
  }, [curso, isOpen, faculdadeSelecionada])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.faculdade_id) {
      setError('Selecione uma faculdade')
      return
    }

    if (!formData.curso.trim()) {
      setError('O nome do curso é obrigatório')
      return
    }

    if (!formData.duracao.trim()) {
      setError('A duração é obrigatória')
      return
    }

    if (formData.quantidade_de_parcelas < 1) {
      setError('A quantidade de parcelas deve ser maior que 0')
      return
    }

    if (formData.valor_com_desconto_pontualidade < 0) {
      setError('O valor não pode ser negativo')
      return
    }

    if (formData.desconto_percentual < 0 || formData.desconto_percentual > 100) {
      setError('O desconto percentual deve estar entre 0 e 100')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const cursoData = {
        faculdade_id: formData.faculdade_id,
        curso: formData.curso.trim(),
        quantidade_de_parcelas: formData.quantidade_de_parcelas,
        modalidade: formData.modalidade,
        duracao: formData.duracao.trim(),
        valor_com_desconto_pontualidade: Number(formData.valor_com_desconto_pontualidade),
        desconto_percentual: Number(formData.desconto_percentual),
        pratica: formData.pratica,
        laboratorio: formData.laboratorio,
        estagio: formData.estagio,
        tcc: formData.tcc,
        link: formData.link.trim() || null,
        descricao: formData.descricao.trim() || null,
        categoria: formData.categoria.trim() || null,
        ativo: formData.ativo,
      }

      if (curso) {
        // Editar curso existente
        const { error: updateError } = await supabase
          .from('cursos')
          .update(cursoData)
          .eq('id', curso.id)

        if (updateError) {
          console.error('Erro ao atualizar curso:', updateError)
          setError(updateError.message || 'Erro ao atualizar curso')
          return
        }
      } else {
        // Criar novo curso
        const { error: insertError } = await supabase
          .from('cursos')
          .insert(cursoData)

        if (insertError) {
          console.error('Erro ao criar curso:', insertError)
          
          // Verificar se é erro de duplicação
          if (insertError.code === '23505' || insertError.message?.includes('unique')) {
            setError('Já existe um curso com este nome para esta faculdade')
          } else {
            setError(insertError.message || 'Erro ao criar curso')
          }
          return
        }
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Erro inesperado:', err)
      setError(err?.message || 'Erro inesperado ao salvar curso')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {curso ? 'Editar Curso' : 'Novo Curso'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Faculdade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Faculdade <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.faculdade_id}
                onChange={(e) => setFormData({ ...formData, faculdade_id: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent !text-black !bg-white"
                disabled={loading}
              >
                <option value="">Selecione uma faculdade</option>
                {faculdades.map((faculdade) => (
                  <option key={faculdade.id} value={faculdade.id}>
                    {faculdade.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Nome do Curso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Curso <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.curso}
                onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                placeholder="Ex: Engenharia de Software"
                required
                className="!bg-white !text-black"
                disabled={loading}
              />
            </div>

            {/* Descrição do Curso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição do Curso
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Digite uma descrição detalhada do curso..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none !text-black !bg-white"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.descricao.length} caracteres
              </p>
            </div>

            {/* Link do Curso e Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link do Curso
                </label>
                <Input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://exemplo.com/curso"
                  className="!bg-white !text-black"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  URL completa para informações do curso
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <Input
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ex: Tecnologia, Humanas, Exatas..."
                  className="!bg-white !text-black"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Categoria do curso (ex: Tecnologia, Humanas, Exatas)
                </p>
              </div>
            </div>

            {/* Quantidade de Parcelas e Modalidade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade de Parcelas <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantidade_de_parcelas}
                  onChange={(e) => setFormData({ ...formData, quantidade_de_parcelas: parseInt(e.target.value) || 1 })}
                  required
                  className="!bg-white !text-black"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modalidade <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.modalidade}
                  onChange={(e) => setFormData({ ...formData, modalidade: e.target.value as 'Presencial' | 'EAD' | 'Híbrido' })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent !text-black !bg-white"
                  disabled={loading}
                >
                  <option value="Presencial">Presencial</option>
                  <option value="EAD">EAD</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>
            </div>

            {/* Duração */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duração <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.duracao}
                onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                placeholder="Ex: 4 anos, 8 semestres, etc."
                required
                className="!bg-white !text-black"
                disabled={loading}
              />
            </div>

            {/* Valores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor com Desconto de Pontualidade (R$) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_com_desconto_pontualidade}
                  onChange={(e) => setFormData({ ...formData, valor_com_desconto_pontualidade: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                  className="!bg-white !text-black"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desconto Percentual (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.desconto_percentual}
                  onChange={(e) => setFormData({ ...formData, desconto_percentual: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="!bg-white !text-black"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Características do Curso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Características do Curso
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pratica}
                    onChange={(e) => setFormData({ ...formData, pratica: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">Prática</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.laboratorio}
                    onChange={(e) => setFormData({ ...formData, laboratorio: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">Laboratório</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.estagio}
                    onChange={(e) => setFormData({ ...formData, estagio: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">Estágio</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tcc}
                    onChange={(e) => setFormData({ ...formData, tcc: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">TCC</span>
                </label>
              </div>
            </div>

            {/* Status Ativo */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  disabled={loading}
                />
                <span className="text-sm font-medium text-gray-700">Curso ativo</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                className="!bg-gray-100 !text-gray-900 hover:!bg-gray-200"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Salvando...' : curso ? 'Atualizar' : 'Criar'} Curso
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

