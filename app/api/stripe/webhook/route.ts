import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-11-20.acacia', // Use latest or compatible version
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

    const session = event.data.object as Stripe.Checkout.Session

    if (event.type === 'checkout.session.completed') {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        )

        const email = session.customer_details?.email
        const name = session.customer_details?.name

        if (email) {
            try {
                // 1. Check if user exists
                const { data: existingUser } = await supabase
                    .from('profiles') // Assuming profiles table is linked to auth.users
                    .select('*')
                    .eq('email', email)
                    .single()

                let userId = existingUser?.id

                if (!userId) {
                    // 2. Create Auth User if not exists
                    // Note: We can't set password here easily without sending an invite.
                    // For now, we'll create the user and trigger a password reset email manually or via Supabase logic
                    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                        email: email,
                        email_confirm: true,
                        user_metadata: { full_name: name }
                    })

                    if (authError) {
                        console.error('Error creating auth user:', authError)
                        // If user already exists in Auth but not in profiles (rare), handle it
                        if (authError.message.includes('already been registered')) {
                            // Fetch the user ID from auth
                            const { data: userData } = await supabase.rpc('get_user_id_by_email', { email_input: email })
                            // This RPC might not exist, so we might need another way or just ignore
                        }
                    } else {
                        userId = authUser.user.id

                        // Send password reset email (Welcome email)
                        await supabase.auth.admin.inviteUserByEmail(email)
                    }
                }

                // 3. Update/Create Profile with Subscription Info
                // We need to determine the plan based on price ID or metadata
                // For now, we default to 'pro' or read from metadata
                const plan = session.metadata?.plan || 'pro'

                if (userId) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: userId,
                            email: email,
                            nome: name || email.split('@')[0],
                            role: 'admin', // The buyer is an Admin
                            plano: plan,
                            stripe_customer_id: session.customer as string,
                            stripe_subscription_id: subscription.id,
                            status: 'ativo'
                        })

                    if (profileError) {
                        console.error('Error updating profile:', profileError)
                    }
                }

            } catch (err) {
                console.error('Error processing checkout:', err)
                return new NextResponse('Internal Server Error', { status: 500 })
            }
        }
    }

    return new NextResponse(null, { status: 200 })
}
