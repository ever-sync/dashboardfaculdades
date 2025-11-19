'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  User, 
  Phone,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
  DollarSign,
  Zap,
  X,
  Tag,
  Activity,
  Wallet,
  History,
  Search,
  Plus,
  CheckSquare,
  Square
} from 'lucide-react'
import { Prospect } from '@/types/supabase'
import { TagsManager } from '@/components/dashboard/TagsManager'
import { AnotacoesPanel } from '@/components/dashboard/AnotacoesPanel'
import { TimelineProspect } from '@/components/dashboard/TimelineProspect'
import { useState } from 'react'

interface SidebarLeadInfoProps {
  isOpen: boolean
  onClose: () => void
  abaSelecionada: 'perfil' | 'etiquetas' | 'atividades' | 'carteiras' | 'historico' | null
  prospectInfo: Prospect | null
  loadingProspect: boolean
  conversaDetalhes: any
  conversaSelecionada: string | null
  faculdadeId: string
  telefone: string
  nome: string
  mounted: boolean
  formatDate: (dateString: string) => string
  getStatusColor: (status: string) => 'default' | 'success' | 'warning' | 'danger' | 'info'
  onTagsChanged: (novasTags: string[]) => Promise<void>
}

export function SidebarLeadInfo({
  isOpen,
  onClose,
  abaSelecionada,
  prospectInfo,
  loadingProspect,
  conversaDetalhes,
  conversaSelecionada,
  faculdadeId,
  telefone,
  nome,
  mounted,
  formatDate,
  getStatusColor,
  onTagsChanged,
}: SidebarLeadInfoProps) {
  const [carteirasSelecionadas, setCarteirasSelecionadas] = useState<string[]>([])
  const [buscaEtiquetas, setBuscaEtiquetas] = useState('')
  const [buscaAtividades, setBuscaAtividades] = useState('')
  const [buscaHistorico, setBuscaHistorico] = useState('')

  if (!isOpen || !abaSelecionada) return null

  const toggleCarteira = (carteira: string) => {
    setCarteirasSelecionadas(prev => 
      prev.includes(carteira) 
        ? prev.filter(c => c !== carteira)
        : [...prev, carteira]
    )
  }

  const renderPerfil = () => (
    <div className="space-y-4">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold">
            {prospectInfo && (prospectInfo.nome || prospectInfo.nome_completo)
              ? (prospectInfo.nome || prospectInfo.nome_completo || 'SN')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{nome}</h3>
            {prospectInfo?.created_at && (
              <p className="text-xs text-gray-500">
                Cliente desde {mounted ? formatDate(prospectInfo.created_at) : '...'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-gray-900 mb-3">Informações pessoais</h4>
        
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Nome</label>
          <Input
            value={prospectInfo?.nome || prospectInfo?.nome_completo || nome || ''}
            readOnly
            className="!bg-gray-50"
          />
        </div>

        {prospectInfo?.email && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Email</label>
            <Input
              value={prospectInfo.email}
              readOnly
              className="!bg-gray-50"
            />
          </div>
        )}

        {prospectInfo?.cpf && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">CPF</label>
            <Input
              value={prospectInfo.cpf}
              readOnly
              className="!bg-gray-50"
            />
          </div>
        )}


        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Descrição</label>
          <textarea
            value={prospectInfo?.observacoes || ''}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg !bg-gray-50 resize-none"
            rows={3}
          />
        </div>

        {prospectInfo?.cep && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">CEP</label>
            <Input
              value={prospectInfo.cep}
              readOnly
              className="!bg-gray-50"
            />
          </div>
        )}

        {prospectInfo?.bairro && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Bairro</label>
            <Input
              value={prospectInfo.bairro}
              readOnly
              className="!bg-gray-50"
            />
          </div>
        )}

        {prospectInfo?.estado && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Estado</label>
            <Input
              value={prospectInfo.estado}
              readOnly
              className="!bg-gray-50"
            />
          </div>
        )}

        {prospectInfo?.cidade && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Cidade</label>
            <Input
              value={prospectInfo.cidade}
              readOnly
              className="!bg-gray-50"
            />
          </div>
        )}

        {prospectInfo?.endereco && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Rua</label>
            <Input
              value={prospectInfo.endereco}
              readOnly
              className="!bg-gray-50"
            />
          </div>
        )}
      </div>
    </div>
  )

  const renderEtiquetas = () => (
    <div className="space-y-4">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold">
            {nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{nome}</h3>
            {prospectInfo?.created_at && (
              <p className="text-xs text-gray-500">
                Cliente desde {mounted ? formatDate(prospectInfo.created_at) : '...'}
              </p>
            )}
          </div>
        </div>
      </div>

      {conversaDetalhes && faculdadeId && conversaSelecionada ? (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Selecionadas</h4>
            {conversaDetalhes.tags && conversaDetalhes.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {conversaDetalhes.tags.map((tag: string) => (
                  <Badge key={tag} variant="default" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhuma etiqueta selecionada.</p>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Não Selecionadas</h4>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar"
                value={buscaEtiquetas}
                onChange={(e) => setBuscaEtiquetas(e.target.value)}
                className="pl-10"
              />
            </div>
            <TagsManager
              tagsAtuais={conversaDetalhes.tags || []}
              conversaId={conversaSelecionada}
              faculdadeId={faculdadeId}
              setor={conversaDetalhes.setor}
              onTagsChanged={onTagsChanged}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Nenhuma etiqueta disponível.</p>
      )}
    </div>
  )

  const renderAtividades = () => (
    <div className="space-y-4">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold">
            {nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{nome}</h3>
            {prospectInfo?.created_at && (
              <p className="text-xs text-gray-500">
                Cliente desde {mounted ? formatDate(prospectInfo.created_at) : '...'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-gray-900 mb-3">Cadastrar Atividades</h4>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {['E-mail', 'Ligação', 'Proposta', 'Visita', 'Reunião', 'Anotações'].map((tipo) => (
            <Button
              key={tipo}
              variant="secondary"
              size="sm"
              className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
            >
              {tipo}
            </Button>
          ))}
        </div>
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Descrição</label>
          <textarea
            placeholder="Descreva a atividade..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
            rows={4}
          />
        </div>
        <div className="mb-4">
          <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Definir um agendamento
          </button>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <input type="checkbox" id="publica" className="w-4 h-4" />
          <label htmlFor="publica" className="text-sm text-gray-700">Tornar pública</label>
        </div>
        <Button className="w-full !bg-blue-600 hover:!bg-blue-700">
          Cadastrar Atividade
        </Button>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold text-sm text-gray-900 mb-3">Atividades Pendentes</h4>
        <p className="text-sm text-gray-500">Nenhuma atividade encontrada.</p>
      </div>
    </div>
  )

  const renderCarteiras = () => (
    <div className="space-y-4">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold">
            {nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{nome}</h3>
            {prospectInfo?.created_at && (
              <p className="text-xs text-gray-500">
                Cliente desde {mounted ? formatDate(prospectInfo.created_at) : '...'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-gray-900 mb-3">Carteiras</h4>
        <div className="space-y-2">
          {['Jorge', 'João', 'Matheus', 'Rafael Santos'].map((carteira) => (
            <div key={carteira} className="flex items-center gap-2">
              <button
                onClick={() => toggleCarteira(carteira)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 w-full p-2 rounded hover:bg-gray-50"
              >
                {carteirasSelecionadas.includes(carteira) ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
                <span>{carteira}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderHistorico = () => (
    <div className="space-y-4">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold">
            {nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{nome}</h3>
            {prospectInfo?.created_at && (
              <p className="text-xs text-gray-500">
                Cliente desde {mounted ? formatDate(prospectInfo.created_at) : '...'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-gray-900 mb-3">Histórico de Atendimentos</h4>
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
              15/11/2025 - 18/11/2025
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Protocolo"
              value={buscaHistorico}
              onChange={(e) => setBuscaHistorico(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <p className="text-sm text-gray-500">Nenhum atendimento encontrado.</p>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (abaSelecionada) {
      case 'perfil':
        return renderPerfil()
      case 'etiquetas':
        return renderEtiquetas()
      case 'atividades':
        return renderAtividades()
      case 'carteiras':
        return renderCarteiras()
      case 'historico':
        return renderHistorico()
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900 capitalize">
          {abaSelecionada === 'perfil' && 'Perfil'}
          {abaSelecionada === 'etiquetas' && 'Etiquetas'}
          {abaSelecionada === 'atividades' && 'Atividades'}
          {abaSelecionada === 'carteiras' && 'Carteiras'}
          {abaSelecionada === 'historico' && 'Histórico'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loadingProspect ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  )
}

