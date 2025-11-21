import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Variáveis de ambiente do Supabase não encontradas')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugEvolution() {
    console.log('Iniciando debug da Evolution API...')

    // 1. Buscar configuração
    const { data: configUrl } = await supabase
        .from('configuracoes_globais')
        .select('valor')
        .eq('chave', 'evolution_api_url')
        .single()

    const { data: configKey } = await supabase
        .from('configuracoes_globais')
        .select('valor')
        .eq('chave', 'evolution_api_key')
        .single()

    const apiUrl = configUrl?.valor
    const apiKey = configKey?.valor

    if (!apiUrl || !apiKey) {
        console.error('Configuração da Evolution API não encontrada no banco')
        return
    }

    console.log('URL da API:', apiUrl)
    console.log('API Key encontrada:', apiKey ? 'Sim (ocultada)' : 'Não')

    // 2. Buscar uma instância para testar (a última criada)
    const { data: faculdade } = await supabase
        .from('faculdades')
        .select('id, nome, evolution_instance')
        .not('evolution_instance', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (!faculdade) {
        console.error('Nenhuma faculdade com instância encontrada')
        return
    }

    console.log('Testando com a faculdade:', faculdade.nome)
    console.log('Instância:', faculdade.evolution_instance)

    // 3. Tentar buscar QR Code
    try {
        const connectUrl = `${apiUrl}/instance/connect/${faculdade.evolution_instance}`
        console.log('Fazendo requisição para:', connectUrl)

        const response = await fetch(connectUrl, {
            method: 'GET',
            headers: {
                'apikey': apiKey,
                'Content-Type': 'application/json'
            }
        })

        console.log('Status da resposta:', response.status)
        const text = await response.text()
        console.log('Corpo da resposta (RAW):')
        console.log(text)

        try {
            const json = JSON.parse(text)
            console.log('JSON parseado:', JSON.stringify(json, null, 2))
        } catch (e) {
            console.log('Não é um JSON válido')
        }

    } catch (error) {
        console.error('Erro na requisição:', error)
    }
}

debugEvolution()
