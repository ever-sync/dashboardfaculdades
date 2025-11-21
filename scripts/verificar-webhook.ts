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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const evolutionApiUrl = process.env.EVOLUTION_API_URL
const evolutionApiKey = process.env.EVOLUTION_API_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

if (!evolutionApiUrl || !evolutionApiKey) {
    console.error('Missing Evolution API credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log('=== VERIFICANDO WEBHOOK EVOLUTION API ===\n')

    // 1. Buscar faculdade com instância
    const { data: faculdade, error } = await supabase
        .from('faculdades')
        .select('*')
        .neq('evolution_instance', null)
        .limit(1)
        .single()

    if (error || !faculdade) {
        console.error('❌ Nenhuma faculdade com evolution_instance encontrada')
        return
    }

    console.log('✅ Faculdade:', faculdade.nome)
    console.log('📱 Instância:', faculdade.evolution_instance)
    console.log('')

    // 2. Verificar webhook atual
    console.log('🔍 Verificando webhook atual...')
    try {
        const response = await fetch(`${evolutionApiUrl}/webhook/find/${faculdade.evolution_instance}`, {
            method: 'GET',
            headers: {
                'apikey': evolutionApiKey,
            },
        })

        if (response.ok) {
            const webhook = await response.json()
            console.log('Webhook atual:', JSON.stringify(webhook, null, 2))
            console.log('')
        } else {
            console.log('⚠️ Nenhum webhook configurado ainda')
            console.log('')
        }
    } catch (err) {
        console.error('Erro ao buscar webhook:', err)
    }

    // 3. Configurar webhook
    console.log('🔧 Configurando webhook...')
    const webhookUrl = 'http://localhost:3000/api/webhooks/evolution'

    try {
        const response = await fetch(`${evolutionApiUrl}/webhook/set/${faculdade.evolution_instance}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionApiKey,
            },
            body: JSON.stringify({
                enabled: true,
                url: webhookUrl,
                webhookByEvents: true,
                events: [
                    'MESSAGES_UPSERT',
                    'MESSAGES_UPDATE',
                    'CONNECTION_UPDATE',
                    'QRCODE_UPDATED'
                ]
            }),
        })

        const result = await response.json()

        if (response.ok) {
            console.log('✅ Webhook configurado com sucesso!')
            console.log('URL:', webhookUrl)
            console.log('Eventos:', result.events)
            console.log('')
        } else {
            console.error('❌ Erro ao configurar webhook:', result)
            console.log('')
        }
    } catch (err) {
        console.error('❌ Erro ao configurar webhook:', err)
    }

    // 4. Testar webhook manualmente
    console.log('🧪 Testando webhook manualmente...')
    console.log('Enviando payload de teste para:', webhookUrl)

    try {
        const testPayload = {
            type: 'MESSAGES_UPSERT',
            instance: faculdade.evolution_instance,
            data: {
                key: {
                    remoteJid: '5511999999999@s.whatsapp.net',
                    fromMe: false,
                    id: 'TEST_' + Date.now()
                },
                pushName: 'Teste Manual',
                message: {
                    conversation: 'Mensagem de teste ' + new Date().toISOString()
                },
                messageTimestamp: Math.floor(Date.now() / 1000)
            }
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload),
        })

        const result = await response.json()

        console.log('Status:', response.status)
        console.log('Resposta:', result)

        if (response.ok) {
            console.log('\n✅ Webhook respondeu corretamente!')
            console.log('Verifique o terminal do npm run dev para ver os logs')
        } else {
            console.log('\n❌ Webhook retornou erro')
        }
    } catch (err) {
        console.error('❌ Erro ao testar webhook:', err)
    }
}

run()
