'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { 
  Send, 
  Users, 
  MessageSquare,
  Upload,
  FileText,
  Search,
  Filter,
  Clock,
  Settings,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Plus,
  Phone,
  Mail,
  Calendar,
  Zap
} from 'lucide-react'
import { useState } from 'react'
import { useFaculdade } from '@/contexts/FaculdadeContext'

interface Destinatario {
  id: string
  nome: string
  telefone: string
  email?: string
  curso?: string
  selecionado: boolean
}

export default function DisparoMassaPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const [mensagem, setMensagem] = useState('')
  const [buscaDestinatarios, setBuscaDestinatarios] = useState('')
  const [intervalo, setIntervalo] = useState(1)
  const [agendarEnvio, setAgendarEnvio] = useState('')
  const [personalizar, setPersonalizar] = useState(false)
  const [mostrarPreview, setMostrarPreview] = useState(false)
  
  // Mock de destinatários
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([
    { id: '1', nome: 'João Silva', telefone: '(11) 98765-4321', email: 'joao@email.com', curso: 'Engenharia', selecionado: false },
    { id: '2', nome: 'Maria Santos', telefone: '(11) 97654-3210', email: 'maria@email.com', curso: 'Administração', selecionado: false },
    { id: '3', nome: 'Pedro Costa', telefone: '(11) 96543-2109', curso: 'Medicina', selecionado: false },
  ])

  const destinatariosSelecionados = destinatarios.filter(d => d.selecionado).length
  const destinatariosFiltrados = destinatarios.filter(d => 
    d.nome.toLowerCase().includes(buscaDestinatarios.toLowerCase()) ||
    d.telefone.includes(buscaDestinatarios) ||
    d.email?.toLowerCase().includes(buscaDestinatarios.toLowerCase())
  )

  const toggleSelecionar = (id: string) => {
    setDestinatarios(prev => 
      prev.map(dest => 
        dest.id === id ? { ...dest, selecionado: !dest.selecionado } : dest
      )
    )
  }

  const selecionarTodos = () => {
    const todosSelecionados = destinatariosFiltrados.every(d => d.selecionado)
    setDestinatarios(prev => 
      prev.map(dest => {
        const estaNaFiltragem = destinatariosFiltrados.some(d => d.id === dest.id)
        if (estaNaFiltragem) {
          return { ...dest, selecionado: !todosSelecionados }
        }
        return dest
      })
    )
  }

  const caracteres = mensagem.length
  const palavras = mensagem.trim() ? mensagem.trim().split(/\s+/).length : 0
  const tempoEstimado = destinatariosSelecionados * intervalo

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <Header
        title="Disparo em Massa"
        subtitle="Envie mensagens para múltiplos destinatários de forma eficiente"
      />
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border border-gray-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Destinatários</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{destinatarios.length}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Selecionados</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{destinatariosSelecionados}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Caracteres</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{caracteres}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tempo Estimado</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{tempoEstimado}s</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Composição e Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de Composição */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Compor Mensagem</h3>
                      <p className="text-sm text-gray-600">Escreva sua mensagem para envio em massa</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setMostrarPreview(!mostrarPreview)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {mostrarPreview ? 'Ocultar' : 'Preview'}
                  </Button>
                </div>

                {mostrarPreview && mensagem && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        U
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Você</p>
                        <p className="text-xs text-gray-500">Agora</p>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{mensagem}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Digite sua mensagem aqui...&#10;&#10;Você pode usar variáveis como:&#10;{nome} - Nome do destinatário&#10;{curso} - Curso do destinatário"
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent resize-none !text-black !bg-white placeholder-gray-400"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{caracteres} caracteres</span>
                      <span>{palavras} palavras</span>
                      <span>{mensagem.split('\n').length} linhas</span>
                    </div>
                    {caracteres > 1000 && (
                      <div className="flex items-center gap-1 text-xs text-orange-600">
                        <AlertCircle className="w-3 h-3" />
                        Mensagem longa pode ser dividida
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
                  <Button variant="secondary" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Variáveis Disponíveis
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Anexar Mídia
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Importar Template
                  </Button>
                </div>
              </div>
            </Card>

            {/* Card de Configurações */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Configurações de Envio</h3>
                    <p className="text-sm text-gray-600">Configure como as mensagens serão enviadas</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Agendar Envio (Opcional)
                    </label>
                    <Input
                      type="datetime-local"
                      value={agendarEnvio}
                      onChange={(e) => setAgendarEnvio(e.target.value)}
                      className="!bg-white !text-black"
                    />
                    {agendarEnvio && (
                      <p className="text-xs text-gray-500 mt-1">
                        Mensagens serão enviadas em: {new Date(agendarEnvio).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Zap className="w-4 h-4 inline mr-1" />
                      Intervalo entre Mensagens
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={intervalo}
                        onChange={(e) => setIntervalo(Number(e.target.value))}
                        min={1}
                        max={60}
                        className="!bg-white !text-black pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        segundos
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Ajuda a evitar bloqueios do WhatsApp
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={personalizar}
                      onChange={(e) => setPersonalizar(e.target.checked)}
                      className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Personalizar mensagem por destinatário</span>
                      <p className="text-xs text-gray-600 mt-1">
                        Use variáveis como {`{nome}`} e {`{curso}`} para personalização</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Enviar confirmação de leitura</span>
                      <p className="text-xs text-gray-600 mt-1">
                        Receba notificação quando o destinatário ler a mensagem
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </Card>
          </div>

          {/* Coluna Direita - Destinatários */}
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm sticky top-6">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Destinatários</h3>
                      <p className="text-xs text-gray-600">{destinatariosSelecionados} de {destinatarios.length} selecionados</p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    value={buscaDestinatarios}
                    onChange={(e) => setBuscaDestinatarios(e.target.value)}
                    placeholder="Buscar destinatários..."
                    className="pl-10 !bg-white !text-black"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" className="text-xs">
                    <Filter className="w-3 h-3 mr-1" />
                    Filtrar
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="text-xs"
                    onClick={selecionarTodos}
                  >
                    {destinatariosFiltrados.every(d => d.selecionado) ? 'Deselecionar Todos' : 'Selecionar Todos'}
                  </Button>
                  <Button variant="secondary" size="sm" className="text-xs">
                    <Download className="w-3 h-3 mr-1" />
                    Importar
                  </Button>
                  <Button variant="secondary" size="sm" className="text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {/* Lista de destinatários */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {destinatariosFiltrados.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm font-medium">Nenhum destinatário encontrado</p>
                      <p className="text-xs mt-1">Ajuste os filtros ou adicione novos destinatários</p>
                    </div>
                  ) : (
                    destinatariosFiltrados.map((dest) => (
                      <div
                        key={dest.id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          dest.selecionado
                            ? 'bg-gray-50 border-gray-300'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleSelecionar(dest.id)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={dest.selecionado}
                            onChange={() => toggleSelecionar(dest.id)}
                            className="w-4 h-4 mt-1 text-gray-600 border-gray-300 rounded focus:ring-gray-500 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{dest.nome}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Phone className="w-3 h-3" />
                                <span>{dest.telefone}</span>
                              </div>
                              {dest.email && (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{dest.email}</span>
                                </div>
                              )}
                            </div>
                            {dest.curso && (
                              <Badge variant="info" className="mt-2 text-xs">
                                {dest.curso}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Botão de Envio */}
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    className="w-full"
                    disabled={!mensagem.trim() || destinatariosSelecionados === 0}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar para {destinatariosSelecionados} destinatário{destinatariosSelecionados !== 1 ? 's' : ''}
                  </Button>
                  {(!mensagem.trim() || destinatariosSelecionados === 0) && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {!mensagem.trim() && 'Digite uma mensagem. '}
                      {destinatariosSelecionados === 0 && 'Selecione pelo menos um destinatário.'}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

