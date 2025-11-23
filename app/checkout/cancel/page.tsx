'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { XCircle } from 'lucide-react'

export default function CheckoutCancelPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                <div className="mb-6">
                    <XCircle className="w-20 h-20 text-red-500 mx-auto" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Pagamento Cancelado
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Você cancelou o processo de pagamento. Nenhuma cobrança foi realizada.
                </p>
                <div className="space-y-4">
                    <Button
                        onClick={() => router.push('/')}
                        className="w-full"
                        variant="primary"
                    >
                        Voltar para Início
                    </Button>
                    <Button
                        onClick={() => router.back()}
                        className="w-full"
                        variant="outline"
                    >
                        Tentar Novamente
                    </Button>
                </div>
            </div>
        </div>
    )
}





