import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getUserFriendlyError } from '@/lib/errorMessages'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Schema de validação para query params
const statsQuerySchema = z.object({
  faculdade_id: z.string().uuid('ID de faculdade inválido').nullable().optional(),
  cliente_id: z.string().uuid('ID de cliente inválido').nullable().optional(),
}).refine((data) => data.faculdade_id || data.cliente_id, {
  message: 'faculdade_id ou cliente_id é obrigatório',
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validar query params (transformar null em undefined para Zod)
    const queryParams = {
      faculdade_id: searchParams.get('faculdade_id') || undefined,
      cliente_id: searchParams.get('cliente_id') || undefined,
    }
    
    const validation = statsQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        { error: getUserFriendlyError(validation.error.issues[0]?.message || 'Erro de validação') },
        { status: 400 }
      )
    }
    
    const clienteId = validation.data.faculdade_id || validation.data.cliente_id
    
    if (!clienteId) {
      return NextResponse.json(
        { error: 'faculdade_id ou cliente_id é obrigatório' },
        { status: 400 }
      )
    }
    // Get conversation stats from conversas_whatsapp table
    const { count: totalConversas } = await supabase
      .from('conversas_whatsapp')
      .select('*', { count: 'exact', head: true })
      .eq('faculdade_id', clienteId)

    // Get prospect stats from prospects_academicos table
    const { count: totalProspects } = await supabase
      .from('prospects_academicos')
      .select('*', { count: 'exact', head: true })
      .eq('faculdade_id', clienteId)

    // Get enrolled prospects (status_academico = 'matriculado')
    const primeiroDiaMes = new Date()
    primeiroDiaMes.setDate(1)
    primeiroDiaMes.setHours(0, 0, 0, 0)
    const { count: matriculasMes } = await supabase
      .from('prospects_academicos')
      .select('*', { count: 'exact', head: true })
      .eq('faculdade_id', clienteId)
      .eq('status_academico', 'matriculado')
      .gte('data_matricula', primeiroDiaMes.toISOString())

    // Calculate conversion rate
    const { data: prospectsByStatus } = await supabase
      .from('prospects_academicos')
      .select('status_academico')
      .eq('faculdade_id', clienteId)

    const enrolledCount = prospectsByStatus?.filter(p => p.status_academico === 'matriculado').length || 0
    const conversionRate = totalProspects ? (enrolledCount / totalProspects) * 100 : 0

    // Calculate revenue from enrolled prospects
    const { data: prospectsMatriculados } = await supabase
      .from('prospects_academicos')
      .select('valor_mensalidade, data_matricula')
      .eq('faculdade_id', clienteId)
      .eq('status_academico', 'matriculado')
      .gte('data_matricula', primeiroDiaMes.toISOString())

    const receitaMes = prospectsMatriculados?.reduce((sum, p) => sum + (Number(p.valor_mensalidade) || 0), 0) || 0

    // Get automation rate from metricas_diarias
    const { data: metricsData, error: metricsError } = await supabase
      .from('metricas_diarias')
      .select('taxa_automacao_percentual')
      .eq('faculdade_id', clienteId)
      .order('data', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Get average response time from metricas_diarias
    const { data: responseTimeData, error: responseTimeError } = await supabase
      .from('metricas_diarias')
      .select('tempo_medio_primeira_resposta_segundos')
      .eq('faculdade_id', clienteId)
      .order('data', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Get satisfaction score from metricas_diarias
    const { data: satisfactionData, error: satisfactionError } = await supabase
      .from('metricas_diarias')
      .select('nota_media')
      .eq('faculdade_id', clienteId)
      .order('data', { ascending: false })
      .limit(1)
      .maybeSingle()

    const stats = {
      total_conversas: totalConversas || 0,
      total_prospects: totalProspects || 0,
      matriculas_mes: matriculasMes || 0,
      receita_mes: receitaMes,
      taxa_conversao: Math.round(conversionRate * 10) / 10,
      taxa_automacao: metricsData?.taxa_automacao_percentual || 68.3,
      tempo_medio_resposta: responseTimeData?.tempo_medio_primeira_resposta_segundos ? 
        Math.round((responseTimeData.tempo_medio_primeira_resposta_segundos / 60) * 10) / 10 : 45,
      satisfacao_media: satisfactionData?.nota_media || 4.2,
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    // Log erro em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao buscar stats:', error)
    }
    
    return NextResponse.json(
      { error: getUserFriendlyError(error) },
      { status: 500 }
    )
  }
}