'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { Settings, Save, Bell, MessageSquare, Clock, User, Shield, Database, Key, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function AjustesPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    // Notificações
    notificacoes_ativas: true,
    notificacoes_sonoras: true,
    notificacoes_email: false,
    notificacoes_push: true,
    
    // Mensagens
    auto_resposta: false,
    mensagem_ausencia: '',
    horario_atendimento_inicio: '08:00',
    horario_atendimento_fim: '18:00',
    
    // Atendimento
    tempo_resposta_maximo: 5,
    transferencia_automatica: false,
    fila_automatica: true,
    
    // Segurança
    bloqueio_automatico: false,
    tentativas_antes_bloqueio: 3,
    
    // Geral
    timezone: 'America/Sao_Paulo',
    idioma: 'pt-BR',
  })

  useEffect(() => {
    if (faculdadeSelecionada) {
      fetchSettings()
    }
  }, [faculdadeSelecionada])

  const fetchSettings = async () => {
    if (!faculdadeSelecionada) return

    try {
      setLoading(true)
      // Buscar configurações do banco de dados
      const { data, error } = await supabase
        .from('configuracoes_conversas')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .maybeSingle()

      if (error) {
        // Se a tabela não existe ou não há dados, não é um erro crítico
        const isTableNotFound = error.code === 'PGRST116' || 
                                 error.code === '42P01' ||
                                 error.message?.includes('does not exist') || 
                                 error.message?.includes('não existe') ||
                                 error.message?.includes('relation') ||
                                 error.message?.includes('not found')
        
        if (isTableNotFound) {
          // Tabela não existe, usar configurações padrão silenciosamente
          return
        }
        
        // Apenas logar erros reais
        if (error.message) {
          console.error('Erro ao buscar configurações:', error.message)
        }
      } else if (data && data.configuracoes) {
        setSettings({ ...settings, ...data.configuracoes })
      }
    } catch (error: any) {
      // Apenas logar se houver uma mensagem de erro
      if (error?.message) {
        console.error('Erro inesperado ao buscar configurações:', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!faculdadeSelecionada) return

    try {
      setLoading(true)
      
      // Salvar no banco de dados
      const { error } = await supabase
        .from('configuracoes_conversas')
        .upsert({
          faculdade_id: faculdadeSelecionada.id,
          configuracoes: settings,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      alert('Configurações salvas com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <Header
        title="Ajustes"
        subtitle="Configure as opções de conversas e atendimento"
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Configuração Evolution API */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Key className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Evolution API</h2>
                    <p className="text-sm text-gray-600">Configure as credenciais globais da Evolution API</p>
                  </div>
                </div>
                <Link href="/dashboard/conversas/ajustes/evolution-api">
                  <Button variant="primary">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar API
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Notificações */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Notificações</h2>
                  <p className="text-sm text-gray-600">Configure como você deseja receber notificações</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Configuração</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Descrição</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">Ativar notificações</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">Receba notificações de novas mensagens</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={settings.notificacoes_ativas}
                          onChange={(e) => setSettings({ ...settings, notificacoes_ativas: e.target.checked })}
                          className="rounded"
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">Notificações sonoras</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">Reproduzir som ao receber mensagens</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={settings.notificacoes_sonoras}
                          onChange={(e) => setSettings({ ...settings, notificacoes_sonoras: e.target.checked })}
                          className="rounded"
                          disabled={!settings.notificacoes_ativas}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">Notificações por email</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">Receba notificações por email</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={settings.notificacoes_email}
                          onChange={(e) => setSettings({ ...settings, notificacoes_email: e.target.checked })}
                          className="rounded"
                          disabled={!settings.notificacoes_ativas}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">Notificações push</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">Receba notificações no navegador</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={settings.notificacoes_push}
                          onChange={(e) => setSettings({ ...settings, notificacoes_push: e.target.checked })}
                          className="rounded"
                          disabled={!settings.notificacoes_ativas}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Mensagens */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Mensagens</h2>
                  <p className="text-sm text-gray-600">Configure respostas automáticas e horários</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Configuração</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Valor</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">Resposta automática</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">Ativar respostas automáticas para mensagens</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={settings.auto_resposta}
                          onChange={(e) => setSettings({ ...settings, auto_resposta: e.target.checked })}
                          className="rounded"
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">Mensagem de ausência</span>
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          value={settings.mensagem_ausencia}
                          onChange={(e) => setSettings({ ...settings, mensagem_ausencia: e.target.value })}
                          placeholder="Digite a mensagem que será enviada quando não houver atendentes disponíveis"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-black resize-none text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-500">-</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">Horário de atendimento</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={settings.horario_atendimento_inicio}
                            onChange={(e) => setSettings({ ...settings, horario_atendimento_inicio: e.target.value })}
                            className="!bg-white !text-black text-sm"
                          />
                          <span className="text-gray-500">até</span>
                          <Input
                            type="time"
                            value={settings.horario_atendimento_fim}
                            onChange={(e) => setSettings({ ...settings, horario_atendimento_fim: e.target.value })}
                            className="!bg-white !text-black text-sm"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-500">-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Atendimento */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Atendimento</h2>
                  <p className="text-sm text-gray-600">Configure regras de atendimento</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Configuração</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Valor</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">Tempo máximo de resposta</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={settings.tempo_resposta_maximo}
                            onChange={(e) => setSettings({ ...settings, tempo_resposta_maximo: Number(e.target.value) })}
                            min={1}
                            max={60}
                            className="!bg-white !text-black w-24"
                          />
                          <span className="text-sm text-gray-600">minutos</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-500">-</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">Transferência automática</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">Transferir conversas automaticamente quando necessário</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={settings.transferencia_automatica}
                          onChange={(e) => setSettings({ ...settings, transferencia_automatica: e.target.checked })}
                          className="rounded"
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">Fila automática</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">Distribuir conversas automaticamente para atendentes</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={settings.fila_automatica}
                          onChange={(e) => setSettings({ ...settings, fila_automatica: e.target.checked })}
                          className="rounded"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Segurança */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Segurança</h2>
                  <p className="text-sm text-gray-600">Configure bloqueios e proteções</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Configuração</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Valor</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">Bloqueio automático</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">Bloquear contatos automaticamente após tentativas</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={settings.bloqueio_automatico}
                          onChange={(e) => setSettings({ ...settings, bloqueio_automatico: e.target.checked })}
                          className="rounded"
                        />
                      </td>
                    </tr>
                    {settings.bloqueio_automatico && (
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">Tentativas antes do bloqueio</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={settings.tentativas_antes_bloqueio}
                              onChange={(e) => setSettings({ ...settings, tentativas_antes_bloqueio: Number(e.target.value) })}
                              min={1}
                              max={10}
                              className="!bg-white !text-black w-24"
                            />
                            <span className="text-sm text-gray-600">tentativas</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs text-gray-500">-</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Geral */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Geral</h2>
                  <p className="text-sm text-gray-600">Configurações gerais do sistema</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Configuração</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Valor</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">Fuso horário</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={settings.timezone}
                          onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm"
                        >
                          <option value="America/Sao_Paulo">America/Sao_Paulo (Brasília)</option>
                          <option value="America/Manaus">America/Manaus</option>
                          <option value="America/Fortaleza">America/Fortaleza</option>
                          <option value="America/Recife">America/Recife</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-500">-</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">Idioma</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={settings.idioma}
                          onChange={(e) => setSettings({ ...settings, idioma: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm"
                        >
                          <option value="pt-BR">Português (Brasil)</option>
                          <option value="en-US">English (US)</option>
                          <option value="es-ES">Español</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-gray-500">-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loading}
              variant="primary"
              className="!bg-teal-600 hover:!bg-teal-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

