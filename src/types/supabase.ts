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
  created_at: string
  updated_at: string
}

export interface ConversaWhatsApp {
  id: string
  faculdade_id: string
  telefone: string
  nome: string
  status: 'ativo' | 'pendente' | 'encerrado'
  ultima_mensagem?: string
  data_ultima_mensagem: string
  nao_lidas: number
  departamento: string
  atendente?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface Prospect {
  id: string
  faculdade_id: string
  nome: string
  email?: string
  telefone: string
  curso_interesse: string
  status_academico: 'novo' | 'contatado' | 'qualificado' | 'matriculado' | 'perdido'
  origem?: string
  data_ultimo_contato: string
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
  novos_prospects: number
  prospects_convertidos: number
  mensagens_enviadas: number
  mensagens_recebidas: number
  taxa_automacao_percentual: number
  nota_media: number
  tempo_medio_primeira_resposta_segundos: number
  tempo_medio_resolucao_minutos?: number
  departamento?: string
  created_at: string
  updated_at: string
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