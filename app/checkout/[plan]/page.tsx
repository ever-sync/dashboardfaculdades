'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
    const params = useParams()
    const router = useRouter()
    const plan = params.plan as string
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!['basic', 'pro'].includes(plan)) {
            router.push('/')
        }
    }, [plan, router])

    const handleCheckout = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan: plan,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar checkout')
            }

            // Redirecionar para o Stripe Checkout
            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error('URL de checkout não retornada')
            }
        } catch (error: any) {
            console.error('Erro:', error)
            toast.error(error.message || 'Erro ao processar checkout')
            setLoading(false)
        }
    }

    const planNames: Record<string, string> = {
        basic: 'Básico',
        pro: 'Pro',
    }

    const planPrices: Record<string, string> = {
        basic: 'R$ 497',
        pro: 'R$ 997',
    }

    if (!['basic', 'pro'].includes(plan)) {
        return null
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Finalizar Assinatura
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Plano {planNames[plan]}
                    </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                            Plano selecionado:
                        </span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {planNames[plan]}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                            Valor mensal:
                        </span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {planPrices[plan]}
                            <span className="text-sm text-gray-500 dark:text-gray-400">/mês</span>
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <Button
                        onClick={handleCheckout}
                        disabled={loading}
                        className="w-full h-12 text-lg font-bold"
                        variant="primary"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            'Continuar para Pagamento'
                        )}
                    </Button>

                    <Button
                        onClick={() => router.push('/')}
                        disabled={loading}
                        className="w-full"
                        variant="outline"
                    >
                        Voltar
                    </Button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
                    Você será redirecionado para a página de pagamento seguro do Stripe
                </p>
            </div>
        </div>
    )
}


