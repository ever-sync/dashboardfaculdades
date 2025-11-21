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

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log('Starting webhook test...')

    // 1. Get a faculdade with instance
    const { data: faculdade, error } = await supabase
        .from('faculdades')
        .select('*')
        .neq('evolution_instance', null)
        .limit(1)
        .single()

    if (error || !faculdade) {
        console.error('No faculdade with evolution_instance found. Please configure one first.')
        return
    }

    console.log('Using faculdade:', faculdade.nome, 'Instance:', faculdade.evolution_instance)

    // 2. Prepare payload
    const timestamp = Date.now()
    const payload = {
        type: 'messages.upsert',
        instance: faculdade.evolution_instance,
        data: {
            key: {
                remoteJid: '5511999999999@s.whatsapp.net',
                fromMe: false,
                id: 'TEST_MSG_' + timestamp
            },
            pushName: 'Test Script User',
            message: {
                conversation: 'Hello from test script ' + new Date().toISOString()
            }
        }
    }

    // 3. Send webhook
    console.log('Sending webhook to http://localhost:3000/api/webhooks/evolution...')
    try {
        const response = await fetch('http://localhost:3000/api/webhooks/evolution', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        console.log('Response status:', response.status)
        const responseData = await response.json()
        console.log('Response data:', responseData)

        if (response.ok) {
            // 4. Verify DB
            console.log('Verifying database...')
            // Wait a bit
            await new Promise(r => setTimeout(r, 2000))

            const { data: messages, error: msgError } = await supabase
                .from('mensagens')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5)

            if (msgError) {
                console.error('Error fetching messages:', msgError)
            } else {
                console.log('Last 5 messages in DB:', messages)
                const found = messages.find(m => m.conteudo === payload.data.message.conversation)
                if (found) {
                    console.log('SUCCESS: Message found!', found)

                    // Verify conversation update
                    const { data: conversa } = await supabase
                        .from('conversas_whatsapp')
                        .select('*')
                        .eq('id', found.conversa_id)
                        .single()

                    if (conversa) {
                        console.log('Conversation updated:', conversa.ultima_mensagem === payload.data.message.conversation)
                        console.log('Unread count:', conversa.nao_lidas)
                    }
                } else {
                    console.log('FAILURE: Specific message not found in last 5.')
                }
            }
        } else {
            console.error('Webhook request failed')
        }
    } catch (err) {
        console.error('Error sending webhook:', err)
    }
}

run()
