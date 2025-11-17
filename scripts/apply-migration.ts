/**
 * Script para mostrar instruções de como aplicar migrations do Supabase
 * 
 * Execute com: npx tsx scripts/apply-migration.ts <nome-do-arquivo>
 * 
 * Exemplo: npx tsx scripts/apply-migration.ts 014_create_usuarios_table.sql
 * 
 * Requer variáveis de ambiente:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://seu-projeto.supabase.co'

async function showMigrationInstructions(migrationFile: string) {
  try {
    console.log(`\n📝 Migration: ${migrationFile}\n`)
    console.log('═'.repeat(70))

    // Ler arquivo SQL
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', migrationFile)
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log(`\n📋 INSTRUÇÕES PARA APLICAR A MIGRATION:\n`)
    console.log(`1. Acesse o Dashboard do Supabase:`)
    console.log(`   ${supabaseUrl.replace('/rest/v1', '').replace('https://', 'https://app.supabase.com/project/')}/sql`)
    console.log(`\n2. Vá em "SQL Editor" (menu lateral esquerdo)`)
    console.log(`\n3. Clique em "New query"`)
    console.log(`\n4. Cole o SQL abaixo:`)
    console.log(`\n${'─'.repeat(70)}`)
    console.log(sql)
    console.log(`${'─'.repeat(70)}\n`)
    console.log(`5. Clique em "Run" ou pressione Ctrl+Enter (Cmd+Enter no Mac)`)
    console.log(`\n6. Aguarde a confirmação de sucesso\n`)
    console.log('═'.repeat(70))
    console.log(`\n✨ Após executar, a tabela 'usuarios' estará disponível!\n`)

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`\n❌ Arquivo não encontrado: ${migrationFile}`)
      console.error(`\n💡 Verifique se o arquivo existe em: supabase/migrations/${migrationFile}\n`)
    } else {
      console.error(`\n❌ Erro ao ler migration:`, error.message)
    }
    process.exit(1)
  }
}

// Obter nome do arquivo da migration
const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('❌ Nome do arquivo de migration não fornecido!')
  console.error('\nUso: npx tsx scripts/apply-migration.ts <nome-do-arquivo>')
  console.error('\nExemplo: npx tsx scripts/apply-migration.ts 014_create_usuarios_table.sql')
  process.exit(1)
}

// Executar
showMigrationInstructions(migrationFile)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

