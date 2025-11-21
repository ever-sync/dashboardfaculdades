import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validarConversaFaculdade } from '@/lib/faculdadeValidation'
import { randomUUID } from 'crypto'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const conversaId = searchParams.get('conversa_id')
        const faculdadeId = searchParams.get('faculdade_id')

        if (!conversaId || !faculdadeId) {
            return NextResponse.json(
                { error: 'conversa_id e faculdade_id são obrigatórios' },
                { status: 400 }
            )
        }

        // Validar se a conversa pertence à faculdade
        const validacao = await validarConversaFaculdade(conversaId, faculdadeId)
        if (!validacao.valido) {
            return NextResponse.json({ error: validacao.erro }, { status: 403 })
        }

        // Buscar anotações
        const { data, error } = await supabase
            .from('conversas_whatsapp')
            .select('anotacoes')
            .eq('id', conversaId)
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ anotacoes: data.anotacoes || [] })
    } catch (error: any) {
        console.error('Erro ao buscar anotações:', error)
        return NextResponse.json(
            { error: error.message || 'Erro interno ao buscar anotações' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { conversa_id, faculdade_id, texto, autor, autor_id } = body

        if (!conversa_id || !faculdade_id || !texto) {
            return NextResponse.json(
                { error: 'Dados incompletos' },
                { status: 400 }
            )
        }

        // Validar se a conversa pertence à faculdade
        const validacao = await validarConversaFaculdade(conversa_id, faculdade_id)
        if (!validacao.valido) {
            return NextResponse.json({ error: validacao.erro }, { status: 403 })
        }

        // Buscar anotações atuais
        const { data: currentData, error: fetchError } = await supabase
            .from('conversas_whatsapp')
            .select('anotacoes')
            .eq('id', conversa_id)
            .single()

        if (fetchError) throw fetchError

        const currentAnotacoes = currentData.anotacoes || []

        const novaAnotacao = {
            id: randomUUID(),
            texto,
            autor,
            autor_id,
            timestamp: new Date().toISOString()
        }

        const novasAnotacoes = [...currentAnotacoes, novaAnotacao]

        // Atualizar
        const { error: updateError } = await supabase
            .from('conversas_whatsapp')
            .update({ anotacoes: novasAnotacoes })
            .eq('id', conversa_id)

        if (updateError) throw updateError

        return NextResponse.json({ success: true, anotacao: novaAnotacao })
    } catch (error: any) {
        console.error('Erro ao criar anotação:', error)
        return NextResponse.json(
            { error: error.message || 'Erro interno ao criar anotação' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { conversa_id, faculdade_id, anotacao_id, texto } = body

        if (!conversa_id || !faculdade_id || !anotacao_id || !texto) {
            return NextResponse.json(
                { error: 'Dados incompletos' },
                { status: 400 }
            )
        }

        // Validar se a conversa pertence à faculdade
        const validacao = await validarConversaFaculdade(conversa_id, faculdade_id)
        if (!validacao.valido) {
            return NextResponse.json({ error: validacao.erro }, { status: 403 })
        }

        // Buscar anotações atuais
        const { data: currentData, error: fetchError } = await supabase
            .from('conversas_whatsapp')
            .select('anotacoes')
            .eq('id', conversa_id)
            .single()

        if (fetchError) throw fetchError

        const currentAnotacoes = currentData.anotacoes || []
        const index = currentAnotacoes.findIndex((a: any) => a.id === anotacao_id)

        if (index === -1) {
            return NextResponse.json({ error: 'Anotação não encontrada' }, { status: 404 })
        }

        currentAnotacoes[index] = {
            ...currentAnotacoes[index],
            texto,
            editado_em: new Date().toISOString()
        }

        // Atualizar
        const { error: updateError } = await supabase
            .from('conversas_whatsapp')
            .update({ anotacoes: currentAnotacoes })
            .eq('id', conversa_id)

        if (updateError) throw updateError

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Erro ao atualizar anotação:', error)
        return NextResponse.json(
            { error: error.message || 'Erro interno ao atualizar anotação' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json()
        const { conversa_id, faculdade_id, anotacao_id } = body

        if (!conversa_id || !faculdade_id || !anotacao_id) {
            return NextResponse.json(
                { error: 'Dados incompletos' },
                { status: 400 }
            )
        }

        // Validar se a conversa pertence à faculdade
        const validacao = await validarConversaFaculdade(conversa_id, faculdade_id)
        if (!validacao.valido) {
            return NextResponse.json({ error: validacao.erro }, { status: 403 })
        }

        // Buscar anotações atuais
        const { data: currentData, error: fetchError } = await supabase
            .from('conversas_whatsapp')
            .select('anotacoes')
            .eq('id', conversa_id)
            .single()

        if (fetchError) throw fetchError

        const currentAnotacoes = currentData.anotacoes || []
        const novasAnotacoes = currentAnotacoes.filter((a: any) => a.id !== anotacao_id)

        // Atualizar
        const { error: updateError } = await supabase
            .from('conversas_whatsapp')
            .update({ anotacoes: novasAnotacoes })
            .eq('id', conversa_id)

        if (updateError) throw updateError

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Erro ao excluir anotação:', error)
        return NextResponse.json(
            { error: error.message || 'Erro interno ao excluir anotação' },
            { status: 500 }
        )
    }
}
