// Tipos do Supabase para o Dashboard de Faculdades

export interface Faculdade {
  id: string
  nome: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  logo_url?: string
  plano: 'basico' | 'pro' | 'enterprise'
  status: 'ativo' | 'inativo' | 'suspenso'
  data_contratacao?: string
  // Campos Evolution API
  // Nota: evolution_api_url e evolution_api_key são globais (variáveis de ambiente)
  // Cada faculdade tem apenas sua própria instância
  evolution_instance?: string
  evolution_status?: 'conectado' | 'desconectado' | 'conectando' | 'erro' | 'nao_configurado'
  evolution_qr_code?: string
  evolution_qr_expires_at?: string
  evolution_connected_at?: string
  evolution_last_error?: string
  created_at: string
  updated_at: string
}

export interface ConversaWhatsApp {
  id: string
  faculdade_id: string
  telefone: string
  nome: string
  status: 'ativo' | 'pendente' | 'encerrado'
  status_conversa?: 'ativa' | 'pendente' | 'encerrada'
  ultima_mensagem?: string
  data_ultima_mensagem: string
  nao_lidas: number
  departamento: string
  setor?: string
  atendente?: string
  atendente_id?: string
  prospect_id?: string
  duracao_segundos?: number
  avaliacao_nota?: number
  tags?: string[]
  anotacoes?: any[] // JSONB array de anotações
  bloqueado?: boolean
  motivo_bloqueio?: string
  data_bloqueio?: string
  created_at: string
  updated_at: string
}

export interface Prospect {
  id: string
  faculdade_id: string
  nome: string
  nome_completo?: string
  email?: string
  telefone: string
  cpf?: string
  data_nascimento?: string
  tipo_prospect?: 'aluno' | 'nao_aluno' | 'ex_aluno'
  curso: string
  curso_pretendido?: string
  turno?: 'manha' | 'tarde' | 'noite' | 'ead'
  status_academico: 'novo' | 'contatado' | 'qualificado' | 'matriculado' | 'perdido'
  origem?: string
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  cidade?: string
  estado?: string
  data_pagamento?: number // 5, 7 ou 10
  ultimo_contato: string
  data_matricula?: string
  valor_mensalidade?: number
  observacoes?: string
  nota_qualificacao: number
  created_at: string
  updated_at: string
}

export interface Mensagem {
  id: string
  conversa_id: string
  conteudo: string
  remetente: 'usuario' | 'agente' | 'bot'
  tipo_mensagem: 'texto' | 'imagem' | 'documento' | 'audio' | 'video'
  midia_url?: string
  timestamp: string
  lida: boolean
  created_at: string
}

export interface MetricaDiaria {
  id: string
  faculdade_id: string
  data: string
  total_conversas: number
  conversas_ativas: number
  conversas_finalizadas?: number
  novos_prospects: number
  prospects_novos?: number
  prospects_convertidos: number
  mensagens_enviadas: number
  mensagens_recebidas: number
  total_mensagens?: number
  taxa_automacao_percentual: number
  nota_media: number
  tempo_medio_primeira_resposta_segundos: number
  tempo_medio_resposta?: number
  tempo_medio_resolucao_minutos?: number
  departamento?: string
  created_at: string
  updated_at?: string
}

export interface TransferenciaSetor {
  id: string
  faculdade_id: string
  conversa_id: string
  setor_origem: string
  setor_destino: string
  motivo?: string
  atendente_origem?: string
  atendente_destino?: string
  timestamp: string
  created_at: string
}

export interface CodigoAtendimento {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  acao: 'pausar_ia' | 'ativar_ia' | 'transferir' | 'solicitar_humano'
  created_at: string
  updated_at: string
}

export interface MetricaDemografica {
  id: string
  faculdade_id: string
  data: string
  cidade: string
  estado: string
  total_prospects: number
  total_matriculas: number
  receita_estimada: number
  created_at: string
  updated_at: string
}

export interface MetricaPorSetor {
  id: string
  faculdade_id: string
  data: string
  setor: string
  total_atendimentos: number
  atendimentos_finalizados: number
  tempo_medio_atendimento: number
  avaliacoes_positivas: number
  created_at: string
  updated_at: string
}

export interface MetricaPorHorario {
  id: string
  faculdade_id: string
  data: string
  hora: number
  total_mensagens: number
  total_conversas: number
  created_at: string
  updated_at: string
}

export interface AgenteIA {
  id: string
  faculdade_id: string
  nome: string
  script_atendimento: string
  ativo: boolean
  setor?: 'Suporte' | 'Vendas' | 'Atendimento'
  descricao?: string
  configuracao?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Curso {
  id: string
  faculdade_id: string
  curso: string
  quantidade_de_parcelas: number
  modalidade: 'Presencial' | 'EAD' | 'Híbrido'
  duracao: string
  valor_com_desconto_pontualidade: number
  desconto_percentual: number
  pratica: boolean
  laboratorio: boolean
  estagio: boolean
  tcc: boolean
  link?: string
  descricao?: string
  categoria?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface BaseConhecimento {
  id: string
  faculdade_id: string
  pergunta: string
  resposta: string
  categoria?: string
  tags?: string[]
  ativo: boolean
  visualizacoes: number
  util: number
  nao_util: number
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: string
  faculdade_id: string
  nome: string
  email: string
  senha_hash?: string
  setor?: 'Suporte' | 'Vendas' | 'Atendimento'
  status: 'online' | 'offline' | 'ausente' | 'ocupado'
  carga_trabalho_atual: number
  carga_trabalho_maxima: number
  horario_trabalho_inicio: string
  horario_trabalho_fim: string
  dias_trabalho: number[]
  ultima_atividade: string
  ativo: boolean
  foto_url?: string
  created_at: string
  updated_at: string
}

export interface MensagemAgendada {
  id: string
  faculdade_id: string
  conversa_id?: string
  telefone: string
  conteudo: string
  tipo_mensagem: 'texto' | 'imagem' | 'documento' | 'audio' | 'video'
  midia_url?: string
  data_agendamento: string
  status: 'pendente' | 'enviada' | 'cancelada' | 'falha'
  remetente: 'usuario' | 'agente' | 'bot' | 'robo' | 'humano' | 'cliente'
  atendente_id?: string
  tentativas: number
  erro_mensagem?: string
  enviada_em?: string
  created_at: string
  updated_at: string
}

// Tipos auxiliares para queries e respostas da API
export interface DashboardStats {
  total_conversas: number
  total_prospects: number
  matriculas_mes: number
  receita_mes: number
  taxa_conversao: number
  taxa_automacao: number
  tempo_medio_resposta: number
  satisfacao_media: number
}