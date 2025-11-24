import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-11-20.acacia' as any, // Use latest or compatible version
    typescript: true,
})

// Initialize Supabase Admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature') as string

    let event: Stripe.Event

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not defined')
        }
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (error: any) {
        console.error(`Webhook Error: ${error.message}`)
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }

    // Processar diferentes tipos de eventos
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session

            if (!session.subscription) {
                console.error('No subscription found in checkout session')
                return new NextResponse(null, { status: 200 })
            }

            const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string
            )

            const email = session.customer_details?.email
            const name = session.customer_details?.name
            const customerId = session.customer as string

            if (email) {
                try {
                    // 1. Verificar se usuário existe
                    const { data: existingUser } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('email', email)
                        .single()

                    let userId = existingUser?.id

                    if (!userId) {
                        // 2. Criar usuário Auth se não existir
                        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                            email: email,
                            email_confirm: true,
                            user_metadata: { full_name: name }
                        })

                        if (authError) {
                            console.error('Erro ao criar usuário auth:', authError)
                            // Se usuário já existe no Auth mas não no profiles
                            if (authError.message.includes('already been registered')) {
                                // Buscar usuário existente
                                const { data: { users } } = await supabase.auth.admin.listUsers()
                                const existingAuthUser = users.find(u => u.email === email)
                                if (existingAuthUser) {
                                    userId = existingAuthUser.id
                                }
                            }
                        } else {
                            userId = authUser.user.id
                            // Enviar email de boas-vindas
                            await supabase.auth.admin.inviteUserByEmail(email)
                        }
                    }

                    // 3. Atualizar/Criar Profile com informações da assinatura
                    const plan = session.metadata?.plan || 'pro'

                    if (userId) {
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .upsert({
                                id: userId,
                                email: email,
                                nome: name || email.split('@')[0],
                                role: 'admin',
                                plano: plan,
                                stripe_customer_id: customerId,
                                stripe_subscription_id: subscription.id,
                                status: 'ativo'
                            }, {
                                onConflict: 'id'
                            })

                        if (profileError) {
                            console.error('Erro ao atualizar profile:', profileError)
                        }
                    }

                } catch (err) {
                    console.error('Erro ao processar checkout:', err)
                    return new NextResponse('Internal Server Error', { status: 500 })
                }
            }
            break
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription

            try {
                // Atualizar status da assinatura
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        status: subscription.status === 'active' ? 'ativo' : 'inativo',
                        stripe_subscription_id: subscription.id,
                    })
                    .eq('stripe_customer_id', subscription.customer as string)

                if (error) {
                    console.error('Erro ao atualizar assinatura:', error)
                }
            } catch (err) {
                console.error('Erro ao processar atualização de assinatura:', err)
            }
            break
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription

            try {
                // Cancelar assinatura
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        status: 'cancelado',
                        plano: 'basic', // Reverter para plano básico
                    })
                    .eq('stripe_customer_id', subscription.customer as string)

                if (error) {
                    console.error('Erro ao cancelar assinatura:', error)
                }
            } catch (err) {
                console.error('Erro ao processar cancelamento de assinatura:', err)
            }
            break
        }

        default:
            console.log(`Evento não tratado: ${event.type}`)
    }

    return new NextResponse(null, { status: 200 })
}
