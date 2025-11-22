import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/middleware/withAuth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const GET = requireAuth(async (request: NextRequest, context) => {
    const { faculdadeId } = context

    try {
        const { searchParams } = new URL(request.url)
        const dataInicio = searchParams.get('data_inicio')
        const dataFim = searchParams.get('data_fim')
        const status = searchParams.get('status')
        const atendenteId = searchParams.get('atendente_id')

        // Build query
        let query = supabase
            .from('conversas_whatsapp')
            .select(`
        id,
        telefone,
        nome_contato,
        status,
        created_at,
        updated_at,
        atendente_id,
        tags,
        usuarios!conversas_whatsapp_atendente_id_fkey(nome)
      `)
            .eq('faculdade_id', faculdadeId)
            .order('created_at', { ascending: false })

        // Apply filters
        if (dataInicio) {
            query = query.gte('created_at', dataInicio)
        }
        if (dataFim) {
            query = query.lte('created_at', dataFim)
        }
        if (status) {
            query = query.eq('status', status)
        }
        if (atendenteId) {
            query = query.eq('atendente_id', atendenteId)
        }

        const { data: conversas, error } = await query

        if (error) {
            console.error('Erro ao buscar conversas:', error)
            return NextResponse.json({ error: 'Erro ao buscar conversas' }, { status: 500 })
        }

        // Get message counts for each conversation
        const conversasComContagem = await Promise.all(
            (conversas || []).map(async (conversa) => {
                const { count } = await supabase
                    .from('mensagens_whatsapp')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversa_id', conversa.id)

                // Calculate duration
                const inicio = new Date(conversa.created_at)
                const fim = new Date(conversa.updated_at)
                const diffMs = fim.getTime() - inicio.getTime()
                const diffMins = Math.floor(diffMs / 60000)
                const diffHours = Math.floor(diffMins / 60)
                const remainingMins = diffMins % 60

                let duracao = ''
                if (diffHours > 0) {
                    duracao = `${diffHours}h ${remainingMins}m`
                } else {
                    duracao = `${diffMins}m`
                }

                return {
                    data: new Date(conversa.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    telefone: conversa.telefone,
                    nome: conversa.nome_contato || 'Sem nome',
                    status: conversa.status || 'ativo',
                    atendente: (conversa.usuarios as any)?.nome || 'Não atribuído',
                    tags: Array.isArray(conversa.tags) ? conversa.tags.join(', ') : '',
                    mensagens: count || 0,
                    duracao
                }
            })
        )

        return NextResponse.json({ data: conversasComContagem })
    } catch (error) {
        console.error('Erro ao processar exportação de conversas:', error)
        return NextResponse.json(
            { error: 'Erro ao processar exportação' },
            { status: 500 }
        )
    }
}, 'relatorios.export')
