import { createClient } from '@supabase/supabase-js'

let _supabaseAdmin: ReturnType<typeof createClient> | null = null

/**
 * Cria um cliente Supabase Admin com service role key de forma lazy e segura.
 * Não falha durante o build se as variáveis de ambiente não estiverem disponíveis.
 * 
 * @returns Cliente Supabase admin ou lança erro se as variáveis não estiverem configuradas
 */
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Supabase não configurado. NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.'
      )
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return _supabaseAdmin
}

/**
 * Cliente Supabase Admin com inicialização lazy.
 * Usa Proxy para adiar a criação do cliente até que seja realmente usado.
 * Isso previne erros durante o build do Next.js quando as variáveis de ambiente
 * ainda não estão disponíveis.
 */
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = getSupabaseAdmin()
    return (client as any)[prop]
  },
})


