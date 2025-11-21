import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load env manually
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=')
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
        }
    })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const evolutionApiUrl = process.env.EVOLUTION_API_URL!
const evolutionApiKey = process.env.EVOLUTION_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    // URL de produção do Vercel
    const productionUrl = 'https://traedashboardfaculdadessubf.vercel.app'
    const webhookUrl = `${productionUrl}/api/webhooks/evolution`

    console.log('=== CONFIGURANDO WEBHOOK COM URL DE PRODUÇÃO ===\n')
    console.log('URL do webhook:', webhookUrl)
    console.log('')

    // Buscar faculdade
    const { data: faculdade } = await supabase
        .from('faculdades')
        .select('*')
        .neq('evolution_instance', null)
        .limit(1)
        .single()

    if (!faculdade) {
        console.error('❌ Nenhuma faculdade encontrada')
        return
    }

    console.log('Faculdade:', faculdade.nome)
    console.log('Instância:', faculdade.evolution_instance)
    console.log('')

    // Configurar webhook
    try {
        const response = await fetch(`${evolutionApiUrl}/webhook/set/${faculdade.evolution_instance}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionApiKey,
            },
            body: JSON.stringify({
                webhook: {
                    enabled: true,
                    url: webhookUrl,
                    webhookByEvents: true,
                    events: [
                        'MESSAGES_UPSERT',
                        'MESSAGES_UPDATE',
                        'CONNECTION_UPDATE',
                        'QRCODE_UPDATED'
                    ]
                }
            }),
        })

        const result = await response.json()

        if (response.ok) {
            console.log('✅ WEBHOOK CONFIGURADO COM SUCESSO!')
            console.log('')
            console.log('Configuração:', JSON.stringify(result, null, 2))
            console.log('')
            console.log('✅ Agora envie uma mensagem para o WhatsApp conectado.')
            console.log('✅ As mensagens devem aparecer no banco de dados.')
            console.log('')
        } else {
            console.error('❌ Erro:', JSON.stringify(result, null, 2))
        }
    } catch (err) {
        console.error('❌ Erro:', err)
    }
}

run()
