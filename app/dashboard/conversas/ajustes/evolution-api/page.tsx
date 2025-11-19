'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  Settings,
  Key,
  Globe,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  TestTube,
} from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import Link from 'next/link'

export default function EvolutionAPIConfigPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  
  const [config, setConfig] = useState({
    evolution_api_url: '',
    evolution_api_key: '',
  })
  
  const [originalConfig, setOriginalConfig] = useState({
    evolution_api_url: '',
    evolution_api_key: '',
    has_api_key: false,
  })

  // Carregar configurações
  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/evolution/config')
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao carregar configurações')
      }

      const data = await response.json()
      setConfig({
        evolution_api_url: data.evolution_api_url || '',
        evolution_api_key: '', // Sempre vazio, não expor a chave
      })
      setOriginalConfig({
        evolution_api_url: data.evolution_api_url || '',
        evolution_api_key: '',
        has_api_key: data.has_api_key || false,
      })
    } catch (error: any) {
      showToast(error.message || 'Erro ao carregar configurações', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Salvar configurações
  const handleSave = async () => {
    if (!config.evolution_api_url || !config.evolution_api_key) {
      showToast('URL e Chave de API são obrigatórias', 'error')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/evolution/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evolution_api_url: config.evolution_api_url.trim(),
          evolution_api_key: config.evolution_api_key.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar configurações')
      }

      showToast(data.message || 'Configurações salvas com sucesso!', 'success')

      // Recarregar configurações
      await loadConfig()
    } catch (error: any) {
      showToast(error.message || 'Erro ao salvar configurações', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Testar conexão
  const handleTest = async () => {
    if (!config.evolution_api_url || !config.evolution_api_key) {
      showToast('Configure a URL e a Chave de API antes de testar', 'error')
      return
    }

    setTesting(true)
    try {
      const response = await fetch(`${config.evolution_api_url}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': config.evolution_api_key,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      showToast(`Conexão bem-sucedida! ${data.length || 0} instância(s) encontrada(s).`, 'success')
    } catch (error: any) {
      showToast(error.message || 'Erro ao testar conexão com a Evolution API', 'error')
    } finally {
      setTesting(false)
    }
  }

  // Carregar ao montar
  useEffect(() => {
    loadConfig()
  }, [])

  const hasChanges = 
    config.evolution_api_url !== originalConfig.evolution_api_url ||
    (config.evolution_api_key && !originalConfig.has_api_key) ||
    (config.evolution_api_key && config.evolution_api_key !== '')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/conversas/ajustes">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuração Evolution API</h1>
            <p className="text-sm text-gray-500">
              Configure as credenciais globais da Evolution API para todas as faculdades
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Carregando configurações...</span>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="space-y-6">
            {/* Informação */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    Sobre a Evolution API
                  </h3>
                  <p className="text-sm text-blue-800">
                    A Evolution API é uma solução self-hosted para integração com WhatsApp. 
                    Configure a URL base da API e a chave de autenticação aqui. 
                    Cada faculdade terá sua própria instância, mas compartilhará essas credenciais globais.
                  </p>
                </div>
              </div>
            </div>

            {/* URL da API */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  URL da Evolution API *
                </div>
              </label>
              <Input
                type="url"
                value={config.evolution_api_url}
                onChange={(e) => setConfig({ ...config, evolution_api_url: e.target.value })}
                placeholder="https://api.evolution.com.br"
                disabled={saving}
                className="font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                URL base da sua instância Evolution API (ex: https://api.evolution.com.br ou http://localhost:8080)
              </p>
            </div>

            {/* Chave da API */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Chave de API (API Key) *
                </div>
              </label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={config.evolution_api_key}
                  onChange={(e) => setConfig({ ...config, evolution_api_key: e.target.value })}
                  placeholder={originalConfig.has_api_key ? '••••••••••••••••' : 'Digite a chave de API'}
                  disabled={saving}
                  className="font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={saving}
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Chave de autenticação da Evolution API. Esta chave é sensível e será armazenada de forma segura.
              </p>
              {originalConfig.has_api_key && !config.evolution_api_key && (
                <p className="mt-1 text-xs text-blue-600">
                  Uma chave já está configurada. Deixe em branco para manter a atual ou digite uma nova para substituir.
                </p>
              )}
            </div>

            {/* Status */}
            {originalConfig.has_api_key && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    Chave de API configurada
                  </span>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving || !config.evolution_api_url || !config.evolution_api_key}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleTest}
                variant="secondary"
                disabled={testing || !config.evolution_api_url || !config.evolution_api_key}
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Testar Conexão
                  </>
                )}
              </Button>
            </div>

            {/* Aviso de segurança */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-yellow-800">
                    <strong>Segurança:</strong> As credenciais são armazenadas de forma segura no banco de dados. 
                    A chave de API não será exibida após ser salva por questões de segurança.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

