'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  User, 
  Phone,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
  DollarSign,
  Zap,
  X
} from 'lucide-react'
import { Prospect } from '@/types/supabase'
import { TagsManager } from '@/components/dashboard/TagsManager'
import { AnotacoesPanel } from '@/components/dashboard/AnotacoesPanel'
import { TimelineProspect } from '@/components/dashboard/TimelineProspect'

interface InformacoesLeadModalProps {
  isOpen: boolean
  onClose: () => void
  prospectInfo: Prospect | null
  loadingProspect: boolean
  conversaDetalhes: any
  conversaSelecionada: string | null
  faculdadeId: string
  telefone: string
  mounted: boolean
  formatDate: (dateString: string) => string
  getStatusColor: (status: string) => 'default' | 'success' | 'warning' | 'danger' | 'info'
  onTagsChanged: (novasTags: string[]) => Promise<void>
}

export function InformacoesLeadModal({
  isOpen,
  onClose,
  prospectInfo,
  loadingProspect,
  conversaDetalhes,
  conversaSelecionada,
  faculdadeId,
  telefone,
  mounted,
  formatDate,
  getStatusColor,
  onTagsChanged,
}: InformacoesLeadModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Informações do Lead</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {loadingProspect ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : prospectInfo ? (
            <>
              {/* Dados Pessoais */}
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4">
                  <h4 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="p-1.5 bg-blue-50 rounded-lg">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    Dados Pessoais
                  </h4>
                  <div className="space-y-3 text-sm mt-4">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</span>
                      <p className="font-semibold text-gray-900 mt-1 text-base">{prospectInfo.nome || prospectInfo.nome_completo || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{telefone.replace('@s.whatsapp.net', '')}</span>
                    </div>
                    {prospectInfo.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 break-all">{prospectInfo.email}</span>
                      </div>
                    )}
                    {prospectInfo.cpf && (
                      <div className="pt-2 border-t border-gray-50">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">CPF</span>
                        <p className="text-gray-900 mt-1 font-mono">{prospectInfo.cpf}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Curso e Status */}
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4">
                  <h4 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="p-1.5 bg-purple-50 rounded-lg">
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                    </div>
                    Curso e Status
                  </h4>
                  <div className="space-y-3 text-sm mt-4">
                    {prospectInfo.curso && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Curso</span>
                        <p className="font-semibold text-gray-900 mt-1">{prospectInfo.curso}</p>
                      </div>
                    )}
                    {prospectInfo.curso_pretendido && (
                      <div className="pt-2 border-t border-gray-50">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Curso Pretendido</span>
                        <p className="text-gray-700 mt-1">{prospectInfo.curso_pretendido}</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-50">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Status</span>
                      <Badge variant={getStatusColor(prospectInfo.status_academico || 'novo')} className="text-xs px-2.5 py-1">
                        {prospectInfo.status_academico || 'Novo'}
                      </Badge>
                    </div>
                    {prospectInfo.turno && (
                      <div className="pt-2 border-t border-gray-50">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Turno</span>
                        <p className="text-gray-900 mt-1 capitalize">{prospectInfo.turno}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Financeiro */}
              {(prospectInfo.valor_mensalidade || prospectInfo.nota_qualificacao) && (
                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <h4 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                      <div className="p-1.5 bg-green-50 rounded-lg">
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </div>
                      Financeiro
                    </h4>
                    <div className="space-y-3 text-sm mt-4">
                      {prospectInfo.valor_mensalidade && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mensalidade</span>
                          <p className="font-bold text-green-600 text-lg mt-1">
                            R$ {Number(prospectInfo.valor_mensalidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      {prospectInfo.nota_qualificacao !== undefined && (
                        <div className="pt-2 border-t border-gray-50">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nota de Qualificação</span>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-semibold text-gray-900">{prospectInfo.nota_qualificacao}/100</p>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${prospectInfo.nota_qualificacao}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Endereço */}
              {(prospectInfo.cep || prospectInfo.cidade || prospectInfo.estado) && (
                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <h4 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                      <div className="p-1.5 bg-orange-50 rounded-lg">
                        <MapPin className="w-4 h-4 text-orange-600" />
                      </div>
                      Localização
                    </h4>
                    <div className="space-y-2 text-sm mt-4">
                      {prospectInfo.cep && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">CEP</span>
                          <p className="text-gray-900 mt-1 font-mono">{prospectInfo.cep}</p>
                        </div>
                      )}
                      {prospectInfo.endereco && (
                        <div className={prospectInfo.cep ? "pt-2 border-t border-gray-50" : ""}>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Endereço</span>
                          <p className="text-gray-900 mt-1">
                            {prospectInfo.endereco}
                            {prospectInfo.numero && `, ${prospectInfo.numero}`}
                            {prospectInfo.complemento && ` - ${prospectInfo.complemento}`}
                          </p>
                        </div>
                      )}
                      {prospectInfo.bairro && (
                        <div className="pt-2 border-t border-gray-50">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bairro</span>
                          <p className="text-gray-900 mt-1">{prospectInfo.bairro}</p>
                        </div>
                      )}
                      {(prospectInfo.cidade || prospectInfo.estado) && (
                        <div className="pt-2 border-t border-gray-50">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cidade/Estado</span>
                          <p className="text-gray-900 mt-1">
                            {prospectInfo.cidade || ''}{prospectInfo.cidade && prospectInfo.estado ? ' - ' : ''}{prospectInfo.estado || ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Histórico */}
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4">
                  <h4 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                    </div>
                    Histórico
                  </h4>
                  <div className="space-y-3 text-sm mt-4">
                    {prospectInfo.created_at && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cadastro</span>
                        <p className="text-gray-900 mt-1 font-medium">
                          {mounted ? formatDate(prospectInfo.created_at) : '...'}
                        </p>
                      </div>
                    )}
                    {prospectInfo.ultimo_contato && (
                      <div className="pt-2 border-t border-gray-50">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Último Contato</span>
                        <p className="text-gray-900 mt-1 font-medium">
                          {mounted ? formatDate(prospectInfo.ultimo_contato) : '...'}
                        </p>
                      </div>
                    )}
                    {prospectInfo.data_matricula && (
                      <div className="pt-2 border-t border-gray-50">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data de Matrícula</span>
                        <p className="font-bold text-green-600 mt-1 text-base">
                          {mounted ? formatDate(prospectInfo.data_matricula) : '...'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Tags */}
              {conversaDetalhes && faculdadeId && (
                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <h4 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                      <div className="p-1.5 bg-yellow-50 rounded-lg">
                        <Zap className="w-4 h-4 text-yellow-600" />
                      </div>
                      Tags Pré-definidas
                    </h4>
                    <TagsManager
                      tagsAtuais={conversaDetalhes.tags || []}
                      conversaId={conversaSelecionada || ''}
                      faculdadeId={faculdadeId}
                      setor={conversaDetalhes.setor}
                      onTagsChanged={onTagsChanged}
                    />
                  </div>
                </Card>
              )}

              {/* Anotações Internas */}
              {conversaSelecionada && faculdadeId && (
                <div className="mt-3">
                  <AnotacoesPanel
                    conversaId={conversaSelecionada}
                    faculdadeId={faculdadeId}
                    usuarioAtual={{
                      id: 'current-user-id',
                      nome: 'Atendente',
                    }}
                  />
                </div>
              )}

              {/* Timeline de Interações */}
              {conversaDetalhes && (
                <TimelineProspect
                  prospectId={conversaDetalhes.prospect_id || null}
                  telefone={conversaDetalhes.telefone || null}
                  faculdadeId={faculdadeId}
                  conversaAtualId={conversaSelecionada}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12 px-4">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Lead não encontrado</h4>
              <p className="text-xs text-gray-600">
                Este contato ainda não possui cadastro como prospect
              </p>
            </div>
          )}

          {/* Tags e Anotações mesmo sem prospect */}
          {conversaSelecionada && conversaDetalhes && faculdadeId && !prospectInfo && (
            <>
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4">
                  <h4 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="p-1.5 bg-yellow-50 rounded-lg">
                      <Zap className="w-4 h-4 text-yellow-600" />
                    </div>
                    Tags Pré-definidas
                  </h4>
                  <TagsManager
                    tagsAtuais={conversaDetalhes.tags || []}
                    conversaId={conversaSelecionada}
                    faculdadeId={faculdadeId}
                    setor={conversaDetalhes.setor}
                    onTagsChanged={onTagsChanged}
                  />
                </div>
              </Card>

              {/* Timeline de Interações */}
              {conversaDetalhes && (
                <TimelineProspect
                  prospectId={conversaDetalhes.prospect_id || null}
                  telefone={conversaDetalhes.telefone || null}
                  faculdadeId={faculdadeId}
                  conversaAtualId={conversaSelecionada}
                />
              )}

              <AnotacoesPanel
                conversaId={conversaSelecionada}
                faculdadeId={faculdadeId}
                usuarioAtual={{
                  id: 'current-user-id',
                  nome: 'Atendente',
                }}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <Button
            variant="secondary"
            onClick={onClose}
            className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}

