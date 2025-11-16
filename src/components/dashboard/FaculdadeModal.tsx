'use client'

import { useState, useEffect } from 'react'
import { Faculdade } from '@/types/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import {
  validateRequired,
  validateEmail,
  validateCNPJ,
  validatePhone,
  validateEstado,
  validatePlano,
  validateStatus,
  validateLength,
} from '@/lib/validations'

interface FaculdadeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  faculdade?: Faculdade | null
}

export function FaculdadeModal({ isOpen, onClose, onSave, faculdade }: FaculdadeModalProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    plano: 'basico' as 'basico' | 'pro' | 'enterprise',
    status: 'ativo' as 'ativo' | 'inativo' | 'suspenso',
  })

  useEffect(() => {
    if (faculdade) {
      setFormData({
        nome: faculdade.nome || '',
        cnpj: faculdade.cnpj || '',
        telefone: faculdade.telefone || '',
        email: faculdade.email || '',
        endereco: faculdade.endereco || '',
        cidade: faculdade.cidade || '',
        estado: faculdade.estado || '',
        plano: faculdade.plano || 'basico',
        status: faculdade.status || 'ativo',
      })
    } else {
      setFormData({
        nome: '',
        cnpj: '',
        telefone: '',
        email: '',
        endereco: '',
        cidade: '',
        estado: '',
        plano: 'basico',
        status: 'ativo',
      })
    }
    setErrors({})
  }, [faculdade, isOpen])

  if (!isOpen) return null

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validar nome
    const nomeValidation = validateRequired(formData.nome, 'Nome')
    if (!nomeValidation.isValid) {
      newErrors.nome = nomeValidation.error!
    } else {
      const lengthValidation = validateLength(formData.nome, 3, 255, 'Nome')
      if (!lengthValidation.isValid) {
        newErrors.nome = lengthValidation.error!
      }
    }

    // Validar email (se fornecido)
    if (formData.email) {
      const emailValidation = validateEmail(formData.email)
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.error!
      }
    }

    // Validar CNPJ (se fornecido)
    if (formData.cnpj) {
      const cnpjValidation = validateCNPJ(formData.cnpj)
      if (!cnpjValidation.isValid) {
        newErrors.cnpj = cnpjValidation.error!
      }
    }

    // Validar telefone (se fornecido)
    if (formData.telefone) {
      const phoneValidation = validatePhone(formData.telefone)
      if (!phoneValidation.isValid) {
        newErrors.telefone = phoneValidation.error!
      }
    }

    // Validar estado (se fornecido)
    if (formData.estado) {
      const estadoValidation = validateEstado(formData.estado)
      if (!estadoValidation.isValid) {
        newErrors.estado = estadoValidation.error!
      }
    }

    // Validar plano
    const planoValidation = validatePlano(formData.plano)
    if (!planoValidation.isValid) {
      newErrors.plano = planoValidation.error!
    }

    // Validar status
    const statusValidation = validateStatus(formData.status)
    if (!statusValidation.isValid) {
      newErrors.status = statusValidation.error!
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error')
      return
    }

    setLoading(true)

    try {
      const url = faculdade 
        ? `/api/faculdades/${faculdade.id}`
        : '/api/faculdades'
      
      const method = faculdade ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Erro ao salvar faculdade', 'error')
        setLoading(false)
        return
      }

      showToast(
        faculdade ? 'Faculdade atualizada com sucesso!' : 'Faculdade criada com sucesso!',
        'success'
      )
      onSave()
      onClose()
    } catch (err) {
      showToast('Erro ao conectar ao servidor', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {faculdade ? 'Editar Faculdade' : 'Nova Faculdade'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Nome *"
                value={formData.nome}
                onChange={(e) => {
                  setFormData({ ...formData, nome: e.target.value })
                  if (errors.nome) setErrors({ ...errors, nome: '' })
                }}
                error={errors.nome}
                required
              />
            </div>

            <Input
              label="CNPJ"
              value={formData.cnpj}
              onChange={(e) => {
                setFormData({ ...formData, cnpj: e.target.value })
                if (errors.cnpj) setErrors({ ...errors, cnpj: '' })
              }}
              error={errors.cnpj}
              placeholder="00.000.000/0000-00"
            />

            <Input
              label="Telefone"
              value={formData.telefone}
              onChange={(e) => {
                setFormData({ ...formData, telefone: e.target.value })
                if (errors.telefone) setErrors({ ...errors, telefone: '' })
              }}
              error={errors.telefone}
              placeholder="(00) 00000-0000"
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                if (errors.email) setErrors({ ...errors, email: '' })
              }}
              error={errors.email}
              placeholder="contato@faculdade.com"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plano
              </label>
              <select
                value={formData.plano}
                onChange={(e) => setFormData({ ...formData, plano: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="basico">Básico</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="suspenso">Suspenso</option>
              </select>
            </div>

            <Input
              label="Endereço"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
            />

            <Input
              label="Cidade"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
            />

            <Input
              label="Estado"
              value={formData.estado}
              onChange={(e) => {
                setFormData({ ...formData, estado: e.target.value.toUpperCase() })
                if (errors.estado) setErrors({ ...errors, estado: '' })
              }}
              error={errors.estado}
              placeholder="SP"
              maxLength={2}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

