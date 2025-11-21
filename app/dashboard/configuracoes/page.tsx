'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { useState, useEffect } from 'react'
import {
  Settings,
  MessageSquare,
  Bot,
  Bell,
  Users,
  BarChart3,
  Globe,
  Shield,
  Save,
  Check,
  X,
  Info,
  AlertCircle,
  Phone,
  Mail,
  Clock,
  Zap,
  TrendingUp
} from 'lucide-react'

export default function ConfiguracoesPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const [loading, setLoading] = useState(false)
  const [salvo, setSalvo] = useState(false)

  // Configurações de WhatsApp
  const [whatsappProvider, setWhatsappProvider] = useState<'evolution' | 'twilio' | 'baileys'>('evolution')
  const [evolutionUrl, setEvolutionUrl] = useState('')
  const [evolutionKey, setEvolutionKey] = useState('')
  const [evolutionInstance, setEvolutionInstance] = useState('')
  const [twilioSid, setTwilioSid] = useState('')
  const [twilioToken, setTwilioToken] = useState('')
  const [twilioFrom, setTwilioFrom] = useState('')
  const [baileysUrl, setBaileysUrl] = useState('')
  const [baileysKey, setBaileysKey] = useState('')

  // Configurações de IA
  const [iaAtivaPorPadrao, setIaAtivaPorPadrao] = useState(true)
  const [tempoRespostaIa, setTempoRespostaIa] = useState(30) // segundos
  const [respostasAutomaticasAtivas, setRespostasAutomaticasAtivas] = useState(true)

  // Configurações de Distribuição
  const [distribuicaoAutomatica, setDistribuicaoAutomatica] = useState(true)
  const [cargaMaximaAtendente, setCargaMaximaAtendente] = useState(10)
  const [tempoMaximoEspera, setTempoMaximoEspera] = useState(300) // segundos (5 minutos)

  // Configurações de Notificações
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true)
  const [notificarNovaConversa, setNotificarNovaConversa] = useState(true)
  const [notificarMensagemNaoLida, setNotificarMensagemNaoLida] = useState(true)
  const [notificarTransferencia, setNotificarTransferencia] = useState(true)

  // Configurações de Métricas
  const [metaTempoResposta, setMetaTempoResposta] = useState(120) // segundos (2 minutos)
  const [metaTaxaConversao, setMetaTaxaConversao] = useState(15) // porcentagem
  const [metaSatisfacao, setMetaSatisfacao] = useState(4) // nota de 1 a 5

  // Configurações Gerais
  const [fusoHorario, setFusoHorario] = useState('America/Sao_Paulo')
  const [idioma, setIdioma] = useState('pt-BR')
  const [formatoData, setFormatoData] = useState('DD/MM/YYYY')
  const [formatoHora, setFormatoHora] = useState('24h')

  // Configurações de Perfil
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [emailUsuario, setEmailUsuario] = useState('')
  const [telefoneUsuario, setTelefoneUsuario] = useState('')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  // Status de conexão WhatsApp
  const [statusConexao, setStatusConexao] = useState<{
    provider: string
    status: 'conectado' | 'desconectado' | 'verificando'
    message?: string
  } | null>(null)

  // Carregar configurações salvas
  useEffect(() => {
    // Aqui você pode carregar as configurações do banco de dados
    // Por enquanto, vamos usar valores padrão
  }, [faculdadeSelecionada])

  // Verificar status da conexão WhatsApp
  const verificarStatusConexao = async () => {
    if (!faculdadeSelecionada) return

    setStatusConexao({ provider: whatsappProvider, status: 'verificando' })

    try {
      const response = await fetch('/api/whatsapp/send')
      const data = await response.json()

      if (response.ok && data.status) {
        const providerStatus = data.status[whatsappProvider]
        setStatusConexao({
          provider: whatsappProvider,
          status: providerStatus?.connected ? 'conectado' : 'desconectado',
          message: providerStatus?.message
        })
      } else {
        setStatusConexao({
          provider: whatsappProvider,
          status: 'desconectado',
          message: 'Não foi possível verificar a conexão'
        })
      }
    } catch (error: any) {
      setStatusConexao({
        provider: whatsappProvider,
        status: 'desconectado',
        message: error.message || 'Erro ao verificar conexão'
      })
    }
  }

  // Salvar configurações
  const handleSalvar = async (secao: string) => {
    setLoading(true)
    setSalvo(false)

    try {
      // Aqui você salvaria as configurações no banco de dados
      // Por enquanto, vamos apenas simular
      await new Promise(resolve => setTimeout(resolve, 500))

      setSalvo(true)
      setTimeout(() => setSalvo(false), 3000)

      // Se for configurações de WhatsApp, verificar conexão
      if (secao === 'whatsapp') {
        await verificarStatusConexao()
      }
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Configurações"
        subtitle="Gerencie as configurações do sistema"
      />

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUNA ESQUERDA */}
          <div className="space-y-6">
            {/* Seção: WhatsApp */}
            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Integração WhatsApp</h2>
                    <p className="text-xs text-gray-500">Configure o provedor de WhatsApp</p>
                  </div>
                </div>
                {statusConexao && (
                  <Badge
                    variant={statusConexao.status === 'conectado' ? 'success' : statusConexao.status === 'verificando' ? 'info' : 'danger'}
                    className="flex items-center gap-2"
                  >
                    {statusConexao.status === 'verificando' ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                        Verificando...
                      </>
                    ) : statusConexao.status === 'conectado' ? (
                      <>
                        <Check className="w-3 h-3" />
                        Conectado
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        Desconectado
                      </>
                    )}
                  </Badge>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Provedor WhatsApp
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setWhatsappProvider('evolution')}
                      className={`p-4 border-2 rounded-lg text-sm font-medium transition-all ${
                        whatsappProvider === 'evolution'
                          ? 'border-gray-900 bg-gray-50 text-gray-900 shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Evolution API
                    </button>
                    <button
                      onClick={() => setWhatsappProvider('twilio')}
                      className={`p-4 border-2 rounded-lg text-sm font-medium transition-all ${
                        whatsappProvider === 'twilio'
                          ? 'border-gray-900 bg-gray-50 text-gray-900 shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Twilio
                    </button>
                    <button
                      onClick={() => setWhatsappProvider('baileys')}
                      className={`p-4 border-2 rounded-lg text-sm font-medium transition-all ${
                        whatsappProvider === 'baileys'
                          ? 'border-gray-900 bg-gray-50 text-gray-900 shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Baileys
                    </button>
                  </div>
                </div>

                {/* Evolution API */}
                {whatsappProvider === 'evolution' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Input
                      label="URL da API"
                      placeholder="https://api.evolution.com"
                      value={evolutionUrl}
                      onChange={(e) => setEvolutionUrl(e.target.value)}
                    />
                    <Input
                      label="API Key"
                      type="password"
                      placeholder="Sua chave da API"
                      value={evolutionKey}
                      onChange={(e) => setEvolutionKey(e.target.value)}
                    />
                    <Input
                      label="Nome da Instância"
                      placeholder="minha-instancia"
                      value={evolutionInstance}
                      onChange={(e) => setEvolutionInstance(e.target.value)}
                    />
                  </div>
                )}

                {/* Twilio */}
                {whatsappProvider === 'twilio' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Input
                      label="Account SID"
                      placeholder="ACxxxxxxxxxxxxx"
                      value={twilioSid}
                      onChange={(e) => setTwilioSid(e.target.value)}
                    />
                    <Input
                      label="Auth Token"
                      type="password"
                      placeholder="Seu token de autenticação"
                      value={twilioToken}
                      onChange={(e) => setTwilioToken(e.target.value)}
                    />
                    <Input
                      label="Número WhatsApp (From)"
                      placeholder="whatsapp:+5511999999999"
                      value={twilioFrom}
                      onChange={(e) => setTwilioFrom(e.target.value)}
                    />
                  </div>
                )}

                {/* Baileys */}
                {whatsappProvider === 'baileys' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Input
                      label="URL da API"
                      placeholder="http://localhost:3001"
                      value={baileysUrl}
                      onChange={(e) => setBaileysUrl(e.target.value)}
                    />
                    <Input
                      label="API Key"
                      type="password"
                      placeholder="Sua chave da API"
                      value={baileysKey}
                      onChange={(e) => setBaileysKey(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Button
                    onClick={() => handleSalvar('whatsapp')}
                    disabled={loading}
                    variant="primary"
                    className="flex-1"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Configurações
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={verificarStatusConexao}
                    className="flex-1 sm:flex-none"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="hidden sm:inline">Verificar</span>
                    <span className="sm:hidden">Conexão</span>
                  </Button>
                  {salvo && (
                    <Badge variant="success" className="flex items-center gap-2 px-3 py-2">
                      <Check className="w-3 h-3" />
                      Salvo!
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Seção: IA e Automação */}
            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">IA e Automação</h2>
                  <p className="text-xs text-gray-500">Configure assistentes inteligentes</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <label className="block font-medium text-gray-900 mb-1">IA Ativa por Padrão</label>
                    <p className="text-sm text-gray-600">Ativar IA automaticamente em novas conversas</p>
                  </div>
                  <button
                    onClick={() => setIaAtivaPorPadrao(!iaAtivaPorPadrao)}
                    className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 ${
                      iaAtivaPorPadrao ? 'bg-gray-900' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                        iaAtivaPorPadrao ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <label className="block font-medium text-gray-900 mb-1">Respostas Automáticas</label>
                    <p className="text-sm text-gray-600">Ativar respostas baseadas em palavras-chave</p>
                  </div>
                  <button
                    onClick={() => setRespostasAutomaticasAtivas(!respostasAutomaticasAtivas)}
                    className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 ${
                      respostasAutomaticasAtivas ? 'bg-gray-900' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                        respostasAutomaticasAtivas ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo de Resposta da IA (segundos)
                  </label>
                  <Input
                    type="number"
                    min="5"
                    max="300"
                    value={tempoRespostaIa.toString()}
                    onChange={(e) => setTempoRespostaIa(Number(e.target.value))}
                    placeholder="30"
                  />
                </div>

                <Button
                  onClick={() => handleSalvar('ia')}
                  disabled={loading}
                  variant="primary"
                  className="w-full"
                >
                  <Save className="w-4 h-4" />
                  Salvar Configurações
                </Button>
              </div>
            </Card>

            {/* Seção: Distribuição de Conversas */}
            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Distribuição de Conversas</h2>
                  <p className="text-xs text-gray-500">Configure a distribuição automática</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <label className="block font-medium text-gray-900 mb-1">Distribuição Automática</label>
                    <p className="text-sm text-gray-600">Distribuir usando round-robin</p>
                  </div>
                  <button
                    onClick={() => setDistribuicaoAutomatica(!distribuicaoAutomatica)}
                    className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 ${
                      distribuicaoAutomatica ? 'bg-gray-900' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                        distribuicaoAutomatica ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carga Máxima por Atendente
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={cargaMaximaAtendente.toString()}
                      onChange={(e) => setCargaMaximaAtendente(Number(e.target.value))}
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tempo Máximo de Espera (segundos)
                    </label>
                    <Input
                      type="number"
                      min="60"
                      max="3600"
                      value={tempoMaximoEspera.toString()}
                      onChange={(e) => setTempoMaximoEspera(Number(e.target.value))}
                      placeholder="300"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSalvar('distribuicao')}
                  disabled={loading}
                  variant="primary"
                  className="w-full"
                >
                  <Save className="w-4 h-4" />
                  Salvar Configurações
                </Button>
              </div>
            </Card>

            {/* Seção: Métricas e Metas */}
            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Métricas e Metas</h2>
                  <p className="text-xs text-gray-500">Defina metas de desempenho</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta: Tempo Médio de Resposta (segundos)
                  </label>
                  <Input
                    type="number"
                    min="30"
                    max="600"
                    value={metaTempoResposta.toString()}
                    onChange={(e) => setMetaTempoResposta(Number(e.target.value))}
                    placeholder="120"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tempo ideal para primeira resposta</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta: Taxa de Conversão (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={metaTaxaConversao.toString()}
                    onChange={(e) => setMetaTaxaConversao(Number(e.target.value))}
                    placeholder="15"
                  />
                  <p className="text-xs text-gray-500 mt-1">Porcentagem de prospects que viram matrículas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta: Satisfação Mínima (1-5)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={metaSatisfacao.toString()}
                    onChange={(e) => setMetaSatisfacao(Number(e.target.value))}
                    placeholder="4.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Nota mínima esperada nas avaliações</p>
                </div>

                <Button
                  onClick={() => handleSalvar('metricas')}
                  disabled={loading}
                  variant="primary"
                  className="w-full"
                >
                  <Save className="w-4 h-4" />
                  Salvar Configurações
                </Button>
              </div>
            </Card>
          </div>

          {/* COLUNA DIREITA */}
          <div className="space-y-6">
            {/* Seção: Notificações */}
            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Bell className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Notificações</h2>
                  <p className="text-xs text-gray-500">Configure alertas do sistema</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <label className="block font-medium text-gray-900 mb-1">Notificações Ativas</label>
                    <p className="text-sm text-gray-600">Ativar notificações do sistema</p>
                  </div>
                  <button
                    onClick={() => setNotificacoesAtivas(!notificacoesAtivas)}
                    className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 ${
                      notificacoesAtivas ? 'bg-gray-900' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                        notificacoesAtivas ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {notificacoesAtivas && (
                  <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <label className="font-medium text-gray-900 text-sm">Nova Conversa</label>
                      <button
                        onClick={() => setNotificarNovaConversa(!notificarNovaConversa)}
                        className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 ${
                          notificarNovaConversa ? 'bg-gray-900' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                            notificarNovaConversa ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <label className="font-medium text-gray-900 text-sm">Mensagem Não Lida</label>
                      <button
                        onClick={() => setNotificarMensagemNaoLida(!notificarMensagemNaoLida)}
                        className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 ${
                          notificarMensagemNaoLida ? 'bg-gray-900' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                            notificarMensagemNaoLida ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <label className="font-medium text-gray-900 text-sm">Transferência de Conversa</label>
                      <button
                        onClick={() => setNotificarTransferencia(!notificarTransferencia)}
                        className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 ${
                          notificarTransferencia ? 'bg-gray-900' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                            notificarTransferencia ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => handleSalvar('notificacoes')}
                  disabled={loading}
                  variant="primary"
                  className="w-full"
                >
                  <Save className="w-4 h-4" />
                  Salvar Configurações
                </Button>
              </div>
            </Card>

            {/* Seção: Configurações Gerais */}
            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Globe className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Configurações Gerais</h2>
                  <p className="text-xs text-gray-500">Ajustes de localização e idioma</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuso Horário
                  </label>
                  <select
                    value={fusoHorario}
                    onChange={(e) => setFusoHorario(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent !bg-white !text-black transition-colors"
                  >
                    <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                    <option value="America/Manaus">Manaus (GMT-4)</option>
                    <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idioma
                  </label>
                  <select
                    value={idioma}
                    onChange={(e) => setIdioma(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent !bg-white !text-black transition-colors"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="pt-PT">Português (Portugal)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formato de Data
                    </label>
                    <select
                      value={formatoData}
                      onChange={(e) => setFormatoData(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent !bg-white !text-black transition-colors"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formato de Hora
                    </label>
                    <select
                      value={formatoHora}
                      onChange={(e) => setFormatoHora(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent !bg-white !text-black transition-colors"
                    >
                      <option value="24h">24 horas</option>
                      <option value="12h">12 horas (AM/PM)</option>
                    </select>
                  </div>
                </div>

                <Button
                  onClick={() => handleSalvar('gerais')}
                  disabled={loading}
                  variant="primary"
                  className="w-full"
                >
                  <Save className="w-4 h-4" />
                  Salvar Configurações
                </Button>
              </div>
            </Card>

            {/* Seção: Perfil do Usuário */}
            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Meu Perfil</h2>
                  <p className="text-xs text-gray-500">Informações pessoais e segurança</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <Input
                    value={nomeUsuario}
                    onChange={(e) => setNomeUsuario(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail
                  </label>
                  <Input
                    type="email"
                    value={emailUsuario}
                    onChange={(e) => setEmailUsuario(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <Input
                    type="tel"
                    value={telefoneUsuario}
                    onChange={(e) => setTelefoneUsuario(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Alterar Senha
                  </h3>
                  <div className="space-y-4">
                    <Input
                      type="password"
                      label="Senha Atual"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      placeholder="Digite sua senha atual"
                    />
                    <Input
                      type="password"
                      label="Nova Senha"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Digite sua nova senha"
                    />
                    <Input
                      type="password"
                      label="Confirmar Nova Senha"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Confirme sua nova senha"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSalvar('perfil')}
                  disabled={loading || Boolean(novaSenha && novaSenha !== confirmarSenha)}
                  variant="primary"
                  className="w-full"
                >
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </Button>

                {novaSenha && novaSenha !== confirmarSenha && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>As senhas não coincidem</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Informação sobre variáveis de ambiente */}
            <Card className="p-5 bg-blue-50 border border-blue-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                  <Info className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">Sobre as Configurações de WhatsApp</h3>
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                    As credenciais de WhatsApp são configuradas via variáveis de ambiente no servidor.
                    Para alterar as configurações de produção, edite o arquivo <code className="bg-white px-1.5 py-0.5 rounded text-xs font-mono">.env</code> ou
                    configure as variáveis no painel da Vercel.
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    <strong className="text-gray-700">Variáveis necessárias:</strong> EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_API_INSTANCE
                    (para Evolution API) ou TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSPP_FROM (para Twilio).
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
