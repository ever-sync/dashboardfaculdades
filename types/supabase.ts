export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          phone_number: string
          name: string
          status: 'active' | 'pending' | 'closed'
          last_message: string
          last_message_date: string
          unread_count: number
          department: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone_number: string
          name: string
          status?: 'active' | 'pending' | 'closed'
          last_message: string
          last_message_date: string
          unread_count?: number
          department: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone_number?: string
          name?: string
          status?: 'active' | 'pending' | 'closed'
          last_message?: string
          last_message_date?: string
          unread_count?: number
          department?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          content: string
          sender: 'user' | 'agent'
          timestamp: string
          message_type: 'text' | 'image' | 'document'
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          content: string
          sender: 'user' | 'agent'
          timestamp: string
          message_type?: 'text' | 'image' | 'document'
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          content?: string
          sender?: 'user' | 'agent'
          timestamp?: string
          message_type?: 'text' | 'image' | 'document'
          created_at?: string
        }
      }
      prospects: {
        Row: {
          id: string
          name: string
          phone: string
          email: string
          status: 'new' | 'contacted' | 'qualified' | 'enrolled' | 'lost'
          course: string
          score: number
          last_contact: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email: string
          status?: 'new' | 'contacted' | 'qualified' | 'enrolled' | 'lost'
          course: string
          score?: number
          last_contact: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string
          status?: 'new' | 'contacted' | 'qualified' | 'enrolled' | 'lost'
          course?: string
          score?: number
          last_contact?: string
          created_at?: string
          updated_at?: string
        }
      }
      analytics_stats: {
        Row: {
          id: string
          date: string
          total_conversations: number
          active_conversations: number
          new_prospects: number
          converted_prospects: number
          messages_sent: number
          messages_received: number
          department: string
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          total_conversations?: number
          active_conversations?: number
          new_prospects?: number
          converted_prospects?: number
          messages_sent?: number
          messages_received?: number
          department: string
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          total_conversations?: number
          active_conversations?: number
          new_prospects?: number
          converted_prospects?: number
          messages_sent?: number
          messages_received?: number
          department?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
export interface Faculdade {
  id: string
  nome: string
  cnpj?: string
  telefone?: string
  email?: string
  logo_url?: string
  plano: 'basico' | 'pro' | 'enterprise'
  status: 'ativo' | 'inativo' | 'suspenso'
  data_contratacao: string
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

export interface ProspectAcademico {
  id: string
  faculdade_id: string
  nome: string
  telefone: string
  email?: string
  status_academico: 'novo' | 'contatado' | 'qualificado' | 'matriculado' | 'perdido'
  curso: string
  turno?: 'manha' | 'tarde' | 'noite' | 'ead'
  nota_qualificacao: number
  origem?: string
  ultimo_contato: string
  data_matricula?: string
  valor_mensalidade?: number
  observacoes?: string
  created_at: string
  updated_at: string
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
  tempo_medio_primeira_resposta_segundos: number
  tempo_medio_resolucao_minutos: number
  nota_media: number
  departamento?: string
  created_at: string
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
}