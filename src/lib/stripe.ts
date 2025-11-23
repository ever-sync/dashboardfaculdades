import Stripe from 'stripe'

// Inicializar Stripe no servidor
export function getStripeServer(): Stripe {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY não está definida nas variáveis de ambiente')
    }

    return new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-11-20.acacia',
        typescript: true,
    })
}

// Configuração dos planos
export const STRIPE_PLANS = {
    basic: {
        name: 'Básico',
        priceId: process.env.STRIPE_PRICE_ID_BASIC || '', // Você precisará configurar isso
        amount: 49700, // R$ 497,00 em centavos
        currency: 'brl',
        plan: 'basic' as const,
    },
    pro: {
        name: 'Pro',
        priceId: process.env.STRIPE_PRICE_ID_PRO || '', // Você precisará configurar isso
        amount: 99700, // R$ 997,00 em centavos
        currency: 'brl',
        plan: 'pro' as const,
    },
}

// Tipos de planos
export type PlanType = 'basic' | 'pro'





