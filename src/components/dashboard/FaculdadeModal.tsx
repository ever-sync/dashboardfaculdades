'use client'

import { useState, useEffect } from 'react'
import { Faculdade } from '@/types/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Smartphone } from 'lucide-react'
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

  // Evolution API states
  const [evolutionLoading, setEvolutionLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [instanceStatus, setInstanceStatus] = useState<string>('nao_configurado')
  const [instanceName, setInstanceName] = useState('')

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

      // Se não tem evolution_instance, considera como não configurado
      if (!faculdade.evolution_instance) {
        setInstanceStatus('nao_configurado')
        setQrCode(null)
        setInstanceName('')
      } else {
        setInstanceStatus(faculdade.evolution_status || 'desconectado')
        setQrCode(faculdade.evolution_qr_code || null)
        setInstanceName(faculdade.evolution_instance || '')
      }
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
      setInstanceStatus('nao_configurado')
      setQrCode(null)
      setInstanceName('')
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

  const handleCreateInstance = async () => {
    if (!faculdade?.id) {
      showToast('Salve a faculdade primeiro antes de criar uma instância', 'warning')
      return
    }

    if (!instanceName || !instanceName.trim()) {
      showToast('Digite um nome para a instância', 'warning')
      return
    }

    setEvolutionLoading(true)
    try {
      const payload = {
        faculdade_id: faculdade.id,
        instance_name: instanceName.trim()
      }

      console.log('Enviando para API:', payload)

      const res = await fetch('/api/evolution/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      console.log('Resposta da API:', data)

      if (!res.ok) {
        showToast(data.error || 'Erro ao criar instância', 'error')
        return
      }

      showToast('Instância criada com sucesso!', 'success')
      setInstanceStatus('conectando')
      setQrCode(data.qr_code || null)
      onSave() // Recarregar dados
    } catch (err) {
      console.error('Erro ao criar instância:', err)
      showToast('Erro ao criar instância', 'error')
    } finally {
      setEvolutionLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!faculdade?.id) return

    setEvolutionLoading(true)
    try {
      const res = await fetch(`/api/evolution/instance?faculdade_id=${faculdade.id}`, {
        method: 'GET',
      })

      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Erro ao atualizar status', 'error')
        return
      }

      setInstanceStatus(data.status || 'nao_configurado')
      setQrCode(data.qr_code || null)
      showToast('Status atualizado!', 'success')
      onSave() // Recarregar dados
    } catch (err) {
      showToast('Erro ao atualizar status', 'error')
    } finally {
      setEvolutionLoading(false)
    }
  }

  const handleDeleteInstance = async () => {
    if (!faculdade?.id) return

    if (!confirm('Tem certeza que deseja deletar esta instância?')) {
      return
    }

    setEvolutionLoading(true)
    try {
      const res = await fetch(`/api/evolution/instance?faculdade_id=${faculdade.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Erro ao deletar instância', 'error')
        return
      }

      showToast('Instância deletada com sucesso!', 'success')
      setInstanceStatus('nao_configurado')
      setQrCode(null)
      setInstanceName('')
      onSave() // Recarregar dados
    } catch (err) {
      showToast('Erro ao deletar instância', 'error')
    } finally {
      setEvolutionLoading(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'conectado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'desconectado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'conectando':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'erro':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'conectado':
        return 'Conectado'
      case 'desconectado':
        return 'Desconectado'
      case 'conectando':
        return 'Conectando'
      case 'erro':
        return 'Erro'
      case 'nao_configurado':
        return 'Não Configurado'
      default:
        return status
    }
  }


  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {faculdade ? 'Editar Faculdade' : 'Nova Faculdade'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plano
              </label>
              <select
                value={formData.plano}
                onChange={(e) => setFormData({ ...formData, plano: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="basico">Básico</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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


