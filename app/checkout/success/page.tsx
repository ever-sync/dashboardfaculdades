'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { CheckCircle2 } from 'lucide-react'

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const sessionId = searchParams.get('session_id')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Aguardar um pouco para garantir que o webhook processou
        const timer = setTimeout(() => {
            setLoading(false)
        }, 2000)

        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                {loading ? (
                    <div className="space-y-4">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Processando sua assinatura...
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Pagamento Confirmado!
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            Sua assinatura foi ativada com sucesso. Você já pode começar a usar todas as funcionalidades do seu plano.
                        </p>
                        {sessionId && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                                ID da sessão: {sessionId.substring(0, 20)}...
                            </p>
                        )}
                        <Button
                            onClick={() => router.push('/dashboard')}
                            className="w-full"
                            variant="primary"
                        >
                            Ir para o Dashboard
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}





