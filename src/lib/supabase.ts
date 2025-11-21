import { createClient } from '@supabase/supabase-js'

// Define the Database type for better type inference
export type Database = {
    public: {
        Tables: {
            agentes_ia: {
                Row: {
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
                Insert: {
                    id?: string
                    faculdade_id: string
                    nome: string
                    script_atendimento: string
                    ativo?: boolean
                    setor?: 'Suporte' | 'Vendas' | 'Atendimento'
                    descricao?: string
                    configuracao?: Record<string, any>
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    faculdade_id?: string
                    nome?: string
                    script_atendimento?: string
                    ativo?: boolean
                    setor?: 'Suporte' | 'Vendas' | 'Atendimento'
                    descricao?: string
                    configuracao?: Record<string, any>
                    created_at?: string
                    updated_at?: string
                }
            }
            mensagens: {
                Row: {
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
                Insert: {
                    id?: string
                    conversa_id: string
                    conteudo: string
                    remetente: 'usuario' | 'agente' | 'bot'
                    tipo_mensagem: 'texto' | 'imagem' | 'documento' | 'audio' | 'video'
                    midia_url?: string
                    timestamp?: string
                    lida?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    conversa_id?: string
                    conteudo?: string
                    remetente?: 'usuario' | 'agente' | 'bot'
                    tipo_mensagem?: 'texto' | 'imagem' | 'documento' | 'audio' | 'video'
                    midia_url?: string
                    timestamp?: string
                    lida?: boolean
                    created_at?: string
                }
            }
            conversas_whatsapp: {
                Row: {
                    id: string
                    faculdade_id: string
                    telefone: string
                    nome: string
                    status: 'ativo' | 'pendente' | 'encerrado'
                    ultima_mensagem?: string
                    data_ultima_mensagem: string
                    nao_lidas: number
                    departamento: string
                    atendente_id?: string
                    created_at: string
                    updated_at: string
                    anotacoes?: any[]
                }
                Insert: {
                    id?: string
                    faculdade_id: string
                    telefone: string
                    nome: string
                    status?: 'ativo' | 'pendente' | 'encerrado'
                    ultima_mensagem?: string
                    data_ultima_mensagem?: string
                    nao_lidas?: number
                    departamento?: string
                    atendente_id?: string
                    created_at?: string
                    updated_at?: string
                    anotacoes?: any[]
                }
                Update: {
                    id?: string
                    faculdade_id?: string
                    telefone?: string
                    nome?: string
                    status?: 'ativo' | 'pendente' | 'encerrado'
                    ultima_mensagem?: string
                    data_ultima_mensagem?: string
                    nao_lidas?: number
                    departamento?: string
                    atendente_id?: string
                    created_at?: string
                    updated_at?: string
                    anotacoes?: any[]
                }
            }
            typing_indicators: {
                Row: any
                Insert: any
                Update: any
            }
            [key: string]: {
                Row: any
                Insert: any
                Update: any
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            atualizar_typing_indicator: {
                Args: {
                    p_conversa_id: string
                    p_usuario_id: string | null
                    p_usuario_tipo: string
                    p_is_typing: boolean
                }
                Returns: void
            }
            [key: string]: any
        }
        Enums: {
            [_ in never]: never
        }
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const notConfiguredError = new Error('Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
const builder: any = {
  select: () => builder,
  insert: () => builder,
  update: () => builder,
  delete: () => builder,
  eq: () => builder,
  order: () => builder,
  single: () => builder,
  maybeSingle: () => builder,
  limit: () => builder,
  range: () => builder,
  then: (_: any, reject: any) => reject(notConfiguredError)
}

export const supabase: any = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => builder,
      rpc: () => Promise.reject(notConfiguredError),
      auth: {
        getUser: async () => ({ data: { user: null }, error: null })
      },
      channel: () => ({
        on: () => ({ subscribe: () => ({}) }),
        subscribe: () => ({})
      }),
      removeChannel: () => {}
    }