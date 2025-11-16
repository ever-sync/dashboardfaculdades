/**
 * Script para criar usuários no Supabase Auth
 * 
 * Execute com: npx tsx scripts/create-users.ts
 * 
 * Requer variáveis de ambiente:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface UserToCreate {
  email: string
  password: string
  name: string
  role?: string
}

const usersToCreate: UserToCreate[] = [
  {
    email: 'admin@dashboardfaculdades.com',
    password: 'Admin@123',
    name: 'Administrador',
    role: 'admin'
  },
  {
    email: 'gestor@dashboardfaculdades.com',
    password: 'Gestor@123',
    name: 'Gestor',
    role: 'gestor'
  },
  {
    email: 'analista@dashboardfaculdades.com',
    password: 'Analista@123',
    name: 'Analista',
    role: 'analista'
  }
]

async function createUsers() {
  console.log('🚀 Iniciando criação de usuários...\n')

  for (const user of usersToCreate) {
    try {
      console.log(`📝 Criando usuário: ${user.email}`)
      
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          name: user.name,
          role: user.role || 'user'
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`⚠️  Usuário ${user.email} já existe, pulando...`)
        } else {
          throw authError
        }
      } else {
        console.log(`✅ Usuário ${user.email} criado com sucesso!`)
        console.log(`   ID: ${authData.user?.id}`)
        console.log(`   Nome: ${user.name}`)
        console.log(`   Role: ${user.role || 'user'}\n`)
      }
    } catch (error: any) {
      console.error(`❌ Erro ao criar usuário ${user.email}:`, error.message)
      console.log('')
    }
  }

  console.log('✨ Processo concluído!')
  console.log('\n📋 Credenciais criadas:')
  usersToCreate.forEach(user => {
    console.log(`   ${user.email} / ${user.password}`)
  })
  console.log('\n⚠️  IMPORTANTE: Altere as senhas após o primeiro login!')
}

// Executar
createUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error)
    process.exit(1)
  })

