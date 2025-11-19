'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  QrCode,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Trash2,
  AlertCircle,
  Smartphone,
} from 'lucide-react'
import { useFaculdade } from '@/contexts/FaculdadeContext'

interface EvolutionInstance {
  faculdade_id: string
  instance_name: string | null
  status: 'conectado' | 'desconectado' | 'conectando' | 'erro' | 'nao_configurado'
  qr_code: string | null
  qr_expires_at: string | null
  connected_at: string | null
  last_error: string | null
}

export function EvolutionConfig() {
  const { faculdadeSelecionada, loading: loadingFaculdades } = useFaculdade()
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [instance, setInstance] = useState<EvolutionInstance | null>(null)
  const [instanceName, setInstanceName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Carregar dados da instância
  const loadInstance = async () => {
    // Validações antes de carregar
    if (!faculdadeSelecionada) {
      console.warn('loadInstance: Nenhuma faculdade selecionada')
      return
    }

    if (!faculdadeSelecionada.id || typeof faculdadeSelecionada.id !== 'string') {
      console.error('loadInstance: Faculdade sem ID válido:', faculdadeSelecionada)
      setError('Faculdade selecionada não possui ID válido. Selecione outra faculdade.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const faculdadeId = faculdadeSelecionada.id.trim()
      
      // Validar formato UUID básico
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(faculdadeId)) {
        throw new Error(`ID da faculdade não está no formato UUID válido: ${faculdadeId}`)
      }

      // Usar POST diretamente porque GET está perdendo os parâmetros de query string
      // (problema conhecido do Next.js quando há normalização de URL)
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const url = `${baseUrl}/api/evolution/instance`
      
      // Log para debug
      if (process.env.NODE_ENV === 'development') {
        console.log('Carregando instância para faculdade (via POST):', {
          faculdade_id: faculdadeId,
          faculdade_nome: faculdadeSelecionada.nome,
          url,
          baseUrl
        })
      }

      // Usar POST com action: 'get' para buscar a instância
      // Isso evita problemas com query strings sendo perdidas
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faculdade_id: faculdadeId,
          action: 'get' // Indicar que queremos apenas buscar, não criar
        }),
        cache: 'no-store',
      })
      
      if (!response.ok) {
        const data = await response.json()
        const errorMessage = data.error || 'Erro ao carregar instância'
        const errorDetails = data.details ? `\n\n${data.details}` : ''
        const errorSolution = data.solution ? `\n\n💡 ${data.solution}` : ''
        throw new Error(`${errorMessage}${errorDetails}${errorSolution}`)
      }

      const data = await response.json()
      
      // Log de sucesso (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('Instância carregada com sucesso:', {
          faculdade_id: faculdadeId,
          instance_name: data.instance_name,
          status: data.status,
          tem_qr_code: !!data.qr_code
        })
      }
      
      setInstance(data)

      // Se já tem instância configurada, preencher campos
      if (data.instance_name) {
        setInstanceName(data.instance_name)
      }
    } catch (err: any) {
      console.error('Erro ao carregar instância:', err)
      setError(err.message || 'Erro ao carregar instância')
    } finally {
      setLoading(false)
    }
  }

  // Criar instância
  const createInstance = async () => {
    // Validações detalhadas
    if (!faculdadeSelecionada) {
      setError('Selecione uma faculdade primeiro. Use o seletor no topo da página.')
      return
    }

    if (!faculdadeSelecionada.id) {
      console.error('Faculdade selecionada sem ID:', faculdadeSelecionada)
      setError('Faculdade selecionada não possui ID válido. Selecione outra faculdade.')
      return
    }

    if (!instanceName.trim()) {
      setError('Nome da instância é obrigatório')
      return
    }

    setCreating(true)
    setError(null)
    setSuccess(null)

    try {
      const requestBody = {
        faculdade_id: faculdadeSelecionada.id,
        instance_name: instanceName.trim(),
      }

      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('Criando instância com:', {
          faculdade_id: requestBody.faculdade_id,
          instance_name: requestBody.instance_name,
          faculdade: faculdadeSelecionada.nome
        })
      }

      // Validar antes de enviar
      if (!requestBody.faculdade_id || typeof requestBody.faculdade_id !== 'string') {
        throw new Error(`ID da faculdade inválido: ${requestBody.faculdade_id}. Selecione uma faculdade válida.`)
      }

      const response = await fetch('/api/evolution/instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMessage = data.error || 'Erro ao criar instância'
        const errorDetails = data.details ? `\n\n${data.details}` : ''
        const errorSolution = data.solution ? `\n\n💡 ${data.solution}` : ''
        throw new Error(`${errorMessage}${errorDetails}${errorSolution}`)
      }

      const data = await response.json()
      setSuccess('Instância criada com sucesso! Escaneie o QR code abaixo.')
      
      // Recarregar dados
      await loadInstance()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar instância')
    } finally {
      setCreating(false)
    }
  }

  // Deletar instância
  const deleteInstance = async () => {
    if (!faculdadeSelecionada || !confirm('Tem certeza que deseja deletar esta instância?')) {
      return
    }

    if (!faculdadeSelecionada.id || typeof faculdadeSelecionada.id !== 'string') {
      setError('Faculdade selecionada não possui ID válido.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const faculdadeId = faculdadeSelecionada.id.trim()
      
      // Usar POST com action: 'delete' porque DELETE com query string perde os parâmetros
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const url = `${baseUrl}/api/evolution/instance`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faculdade_id: faculdadeId,
          action: 'delete' // Indicar que queremos deletar
        }),
        cache: 'no-store',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao deletar instância')
      }

      setSuccess('Instância deletada com sucesso')
      setInstance(null)
      setInstanceName('')
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar instância')
    } finally {
      setLoading(false)
    }
  }

  // Atualizar QR code
  const refreshQR = async () => {
    await loadInstance()
  }

  // Carregar ao montar e quando faculdade mudar
  useEffect(() => {
    // Não fazer nada enquanto está carregando faculdades
    if (loadingFaculdades) {
      return
    }

    // Só carregar se tiver faculdade selecionada com ID válido
    if (faculdadeSelecionada?.id && typeof faculdadeSelecionada.id === 'string') {
      loadInstance()
      
      // Atualizar status a cada 5 segundos se estiver conectando
      const interval = setInterval(() => {
        if (instance?.status === 'conectando' || !instance?.qr_code) {
          // Verificar novamente antes de recarregar
          if (faculdadeSelecionada?.id && typeof faculdadeSelecionada.id === 'string') {
            loadInstance()
          }
        }
      }, 5000)

      return () => clearInterval(interval)
    } else {
      // Se não tiver faculdade válida, limpar estado
      setInstance(null)
      setInstanceName('')
      setError(null)
    }
  }, [faculdadeSelecionada?.id, loadingFaculdades]) // Incluir loadingFaculdades nas dependências

  // Verificar expiração do QR code
  useEffect(() => {
    if (instance?.qr_code && instance?.qr_expires_at) {
      const expiresAt = new Date(instance.qr_expires_at).getTime()
      const now = Date.now()
      const timeLeft = expiresAt - now

      if (timeLeft > 0) {
        const timer = setTimeout(() => {
          refreshQR()
        }, timeLeft)

        return () => clearTimeout(timer)
      } else {
        refreshQR()
      }
    }
  }, [instance?.qr_expires_at])

  // Mostrar loading enquanto carrega faculdades
  if (loadingFaculdades) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          Carregando faculdades...
        </div>
      </Card>
    )
  }

  // Verificar se há faculdade selecionada
  if (!faculdadeSelecionada) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-3">
          <div className="text-gray-500 font-medium">
            Nenhuma faculdade selecionada
          </div>
          <p className="text-xs text-gray-400">
            Use o seletor de faculdades no topo da página para escolher uma faculdade.
          </p>
        </div>
      </Card>
    )
  }

  // Verificar se a faculdade tem ID válido
  if (!faculdadeSelecionada.id || typeof faculdadeSelecionada.id !== 'string') {
    console.error('Faculdade sem ID válido:', faculdadeSelecionada)
    return (
      <Card className="p-6">
        <div className="text-center space-y-3">
          <div className="text-red-600 font-medium">
            Faculdade selecionada inválida
          </div>
          <p className="text-xs text-gray-500">
            A faculdade "{faculdadeSelecionada.nome || 'N/A'}" não possui um ID válido. 
            Selecione outra faculdade ou recarregue a página.
          </p>
        </div>
      </Card>
    )
  }

  const getStatusBadge = () => {
    if (!instance) return null

    const statusConfig: Record<string, { className: string; icon: any; text: string }> = {
      conectado: { 
        className: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle, 
        text: 'Conectado' 
      },
      desconectado: { 
        className: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: XCircle, 
        text: 'Desconectado' 
      },
      conectando: { 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Loader2, 
        text: 'Conectando...' 
      },
      erro: { 
        className: 'bg-red-100 text-red-800 border-red-200', 
        icon: AlertCircle, 
        text: 'Erro' 
      },
      nao_configurado: { 
        className: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: AlertCircle, 
        text: 'Não Configurado' 
      },
    }

    const config = statusConfig[instance.status] || statusConfig.nao_configurado
    const Icon = config.icon

    return (
      <Badge className={config.className}>
        <Icon className={`w-3 h-3 mr-1 ${instance.status === 'conectando' ? 'animate-spin' : ''}`} />
        {config.text}
      </Badge>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Smartphone className="w-6 h-6 text-gray-700" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Instância Evolution API</h2>
            <p className="text-sm text-gray-500">Configure a conexão WhatsApp para {faculdadeSelecionada.nome}</p>
          </div>
        </div>
        {instance && getStatusBadge()}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          {success}
        </div>
      )}

      {!instance || instance.status === 'nao_configurado' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Instância *
            </label>
            <Input
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="ex: faculdade-unifatecie"
              disabled={creating}
            />
            <p className="mt-1 text-xs text-gray-500">
              Nome único para identificar esta instância (sem espaços, apenas letras, números e hífens)
            </p>
            <p className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
              <strong>Nota:</strong> A configuração da API Evolution (URL e chave) é gerenciada pelo sistema. 
              Você só precisa criar a instância e escanear o QR code.
            </p>
          </div>

          <Button
            onClick={createInstance}
            disabled={!instanceName.trim() || creating}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando Instância...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4 mr-2" />
                Criar Instância
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Informações da Instância */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Instância:</span>
              <span className="text-sm font-semibold text-gray-900">{instance.instance_name}</span>
            </div>
            {instance.connected_at && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Conectado em:</span>
                <span className="text-sm text-gray-600">
                  {new Date(instance.connected_at).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
            {instance.last_error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                <strong>Último erro:</strong> {instance.last_error}
              </div>
            )}
          </div>

          {/* QR Code */}
          {instance.status === 'conectando' && instance.qr_code && (
            <div className="text-center">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Escaneie o QR Code
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Abra o WhatsApp no seu celular, vá em Configurações → Aparelhos conectados → Conectar um aparelho
                </p>
              </div>
              <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200">
                <img
                  src={`data:image/png;base64,${instance.qr_code}`}
                  alt="QR Code Evolution API"
                  className="w-64 h-64"
                />
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  onClick={refreshQR}
                  variant="secondary"
                  size="sm"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar QR Code
                </Button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                O QR code expira em alguns segundos. Atualize se necessário.
              </p>
            </div>
          )}

          {/* Status Conectado */}
          {instance.status === 'conectado' && (
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                WhatsApp Conectado!
              </h3>
              <p className="text-sm text-green-700">
                Sua instância está conectada e pronta para enviar e receber mensagens.
              </p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <Button
              onClick={refreshQR}
              variant="secondary"
              disabled={loading}
              className="flex-1"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar Status
            </Button>
            <Button
              onClick={deleteInstance}
              variant="danger"
              disabled={loading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar Instância
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

