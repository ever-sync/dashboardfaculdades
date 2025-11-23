'use client'

import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const plans = [
    {
        name: 'Básico',
        price: 'R$ 497',
        period: '/mês',
        description: 'Ideal para pequenas faculdades iniciando a operação.',
        features: [
            '1 Faculdade',
            'Até 2 Atendentes',
            'Chatbot Básico',
            'Integração WhatsApp',
            'Suporte por Email'
        ],
        highlight: false,
        cta: 'Começar Agora',
        href: '/checkout/basic',
        color: 'blue'
    },
    {
        name: 'Pro',
        price: 'R$ 997',
        period: '/mês',
        description: 'Para faculdades em crescimento que precisam de mais controle.',
        features: [
            'Até 5 Faculdades',
            'Até 10 Atendentes',
            'Chatbot Avançado (IA)',
            'Relatórios Detalhados',
            'Suporte Prioritário',
            'API de Integração'
        ],
        highlight: true,
        cta: 'Contratar Pro',
        href: '/checkout/pro',
        color: 'purple'
    },
    {
        name: 'Enterprise',
        price: 'Sob Consulta',
        period: '',
        description: 'Solução completa para grandes redes de ensino.',
        features: [
            'Faculdades Ilimitadas',
            'Atendentes Ilimitados',
            'IA Personalizada',
            'Gerente de Conta Dedicado',
            'SLA Garantido',
            'Setup Personalizado'
        ],
        highlight: false,
        cta: 'Falar com Vendas',
        href: '/contato',
        color: 'pink'
    }
]

export function PricingSection() {
    return (
        <section id="precos" className="py-24 bg-white relative">
            {/* Decorative background blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black text-gray-900 mb-4">
                        Planos que <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">crescem com você</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Escolha a melhor opção para gerenciar o atendimento da sua instituição.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative flex flex-col p-8 rounded-3xl bg-white transition-all duration-300 ${plan.highlight
                                    ? 'border-2 border-purple-500 shadow-2xl shadow-purple-100 scale-105 z-10'
                                    : 'border border-gray-100 shadow-xl shadow-gray-50 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-50 hover:-translate-y-1'
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        Mais Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className={`text-2xl font-bold mb-2 ${plan.highlight ? 'text-purple-600' : 'text-gray-900'
                                    }`}>
                                    {plan.name}
                                </h3>
                                <p className="text-gray-500 leading-relaxed">{plan.description}</p>
                            </div>

                            <div className="mb-8 p-4 bg-gray-50 rounded-2xl text-center">
                                <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                                <span className="text-gray-500 font-medium block mt-1">{plan.period}</span>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${plan.highlight ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            <Check className="w-4 h-4" />
                                        </div>
                                        <span className="text-gray-600 font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full h-12 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 ${plan.highlight
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-200'
                                        : 'bg-white border-2 border-gray-100 hover:border-blue-500 hover:text-blue-600 text-gray-700'
                                    }`}
                                onClick={() => window.location.href = plan.href}
                            >
                                {plan.cta}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
