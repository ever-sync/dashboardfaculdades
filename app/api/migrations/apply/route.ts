import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verificar se está em desenvolvimento ou se tem token de admin
    const authHeader = request.headers.get('authorization')
    const isDev = process.env.NODE_ENV === 'development'
    
    if (!isDev && authHeader !== `Bearer ${process.env.ADMIN_TOKEN || 'dev-token'}`) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { migrationFile } = body

    if (!migrationFile) {
      return NextResponse.json(
        { error: 'Nome do arquivo de migration é obrigatório' },
        { status: 400 }
      )
    }

    // Ler arquivo SQL
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', migrationFile)
    const sql = readFileSync(migrationPath, 'utf-8')

    // Usar cliente Supabase admin
    const supabase = supabaseAdmin

    // O Supabase JS não permite executar SQL arbitrário diretamente
    // Vamos retornar o SQL para ser executado manualmente ou via CLI
    return NextResponse.json({
      success: true,
      message: 'Migration carregada. Execute o SQL no Dashboard do Supabase.',
      sql: sql,
      instructions: [
        '1. Acesse o Dashboard do Supabase',
        `2. Vá em SQL Editor (${supabaseUrl.replace('/rest/v1', '')}/project/_/sql)`,
        '3. Cole o SQL abaixo',
        '4. Execute o SQL'
      ]
    })
  } catch (error: any) {
    console.error('Erro ao processar migration:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar migration' },
      { status: 500 }
    )
  }
}

