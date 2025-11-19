/**
 * Helper para buscar configuração global da Evolution API
 * Busca primeiro no banco de dados (tabela configuracoes_globais)
 * Se não encontrar, usa variáveis de ambiente como fallback
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface EvolutionConfig {
  apiUrl: string | undefined
  apiKey: string | undefined
}

/**
 * Buscar configuração global da Evolution API do banco de dados
 * Fallback para variáveis de ambiente se não estiver no banco
 */
export async function getEvolutionConfig(): Promise<EvolutionConfig> {
  try {
    // Tentar buscar do banco primeiro
    const { data: configUrl, error: errorUrl } = await supabase
      .from('configuracoes_globais')
      .select('valor')
      .eq('chave', 'evolution_api_url')
      .maybeSingle()

    const { data: configKey, error: errorKey } = await supabase
      .from('configuracoes_globais')
      .select('valor')
      .eq('chave', 'evolution_api_key')
      .maybeSingle()

    // Verificar se houve erro real (não apenas "não encontrado")
    if (errorUrl && errorUrl.code !== 'PGRST116') {
      throw errorUrl
    }
    if (errorKey && errorKey.code !== 'PGRST116') {
      throw errorKey
    }

    // Usar do banco se disponível, senão usar variáveis de ambiente
    return {
      apiUrl: configUrl?.valor || process.env.EVOLUTION_API_URL,
      apiKey: configKey?.valor || process.env.EVOLUTION_API_KEY,
    }
  } catch (error: any) {
    // Em caso de erro (tabela não existe, etc), usar apenas variáveis de ambiente
    const isTableNotFound = 
      error?.code === 'PGRST116' || 
      error?.code === '42P01' ||
      error?.message?.includes('does not exist') ||
      error?.message?.includes('relation')
    
    if (!isTableNotFound && error?.message) {
      console.warn('Erro ao buscar configuração Evolution do banco:', error.message)
    }
    
    return {
      apiUrl: process.env.EVOLUTION_API_URL,
      apiKey: process.env.EVOLUTION_API_KEY,
    }
  }
}

