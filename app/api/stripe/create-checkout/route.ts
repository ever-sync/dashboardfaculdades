import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeServer, STRIPE_PLANS, PlanType } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { plan, userId, email } = body

        if (!plan || !['basic', 'pro'].includes(plan)) {
            return NextResponse.json(
                { error: 'Plano inválido' },
                { status: 400 }
            )
        }

        const planConfig = STRIPE_PLANS[plan as PlanType]
        const stripe = getStripeServer()

        // Se o usuário estiver logado, buscar ou criar customer no Stripe
        let customerId: string | undefined

        if (userId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('stripe_customer_id')
                .eq('id', userId)
                .single()

            if (profile?.stripe_customer_id) {
                customerId = profile.stripe_customer_id
            } else {
                // Criar customer no Stripe
                const customer = await stripe.customers.create({
                    email: email,
                    metadata: {
                        userId: userId,
                    },
                })
                customerId = customer.id

                // Atualizar profile com customer ID
                await supabase
                    .from('profiles')
                    .update({ stripe_customer_id: customerId })
                    .eq('id', userId)
            }
        }

        // Criar sessão de checkout
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: planConfig.priceId || undefined,
                    quantity: 1,
                },
            ],
            metadata: {
                plan: planConfig.plan,
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/cancel`,
        }

        // Se tiver customer ID, adicionar ao checkout
        if (customerId) {
            sessionParams.customer = customerId
        } else if (email) {
            sessionParams.customer_email = email
        }

        // Se não tiver priceId configurado, usar amount diretamente
        if (!planConfig.priceId) {
            sessionParams.line_items = [
                {
                    price_data: {
                        currency: planConfig.currency,
                        product_data: {
                            name: planConfig.name,
                            description: `Plano ${planConfig.name} - Dashboard Faculdades`,
                        },
                        recurring: {
                            interval: 'month',
                        },
                        unit_amount: planConfig.amount,
                    },
                    quantity: 1,
                },
            ]
        }

        const session = await stripe.checkout.sessions.create(sessionParams)

        return NextResponse.json({ sessionId: session.id, url: session.url })
    } catch (error: any) {
        console.error('Erro ao criar checkout:', error)
        return NextResponse.json(
            { error: error.message || 'Erro ao criar sessão de checkout' },
            { status: 500 }
        )
    }
}

