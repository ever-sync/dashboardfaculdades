'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { PricingSection } from '@/components/landing/PricingSection'
import {
  MessageSquare,
  Zap,
  BarChart3,
  Shield,
  Users,
  Smartphone,
  ArrowRight,
  Sparkles,
  GraduationCap,
  BookOpen
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-to-b from-blue-50 to-transparent rounded-full opacity-50 blur-3xl" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-40 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-25 group-hover:opacity-50 transition-opacity" />
              <div className="relative w-10 h-10 bg-white border-2 border-blue-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              FaculZap
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">Recursos</a>
            <a href="#precos" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">Planos</a>
            <a href="#sobre" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">Sobre</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:flex font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                Login
              </Button>
            </Link>
            <Link href="#precos">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 border-0 transform hover:scale-105 transition-all duration-200">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">

            {/* Floating Elements */}
            <div className="absolute top-0 left-10 animate-bounce duration-[3000ms] hidden lg:block">
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl rotate-12 flex items-center justify-center border-2 border-yellow-200">
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
            <div className="absolute bottom-20 right-10 animate-bounce duration-[4000ms] hidden lg:block">
              <div className="w-16 h-16 bg-purple-100 rounded-full -rotate-12 flex items-center justify-center border-2 border-purple-200">
                <MessageSquare className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 mb-8 animate-fade-in-up hover:bg-blue-100 transition-colors cursor-default">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-sm font-bold tracking-wide">NOVA VERSÃO 2.0</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-gray-900 mb-6 leading-tight">
              Atendimento Escolar <br />
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                  Divertido & Eficiente
                </span>
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-yellow-300 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Transforme a comunicação da sua faculdade com uma plataforma que seus alunos e equipe vão amar usar.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="#precos">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-gray-900 hover:bg-black text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 rounded-2xl">
                  Ver Planos
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg border-2 border-gray-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-200">
                  Como Funciona?
                </Button>
              </Link>
            </div>

            {/* Dashboard Preview Mockup */}
            <div className="mt-20 relative mx-auto max-w-5xl group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative rounded-[1.75rem] bg-white p-2 ring-1 ring-gray-200 shadow-2xl">
                <div className="rounded-3xl bg-gray-50 overflow-hidden aspect-[16/9] flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]"></div>
                  <div className="text-center z-10">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-lg mx-auto mb-6 flex items-center justify-center transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                      <BarChart3 className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Interativo</h3>
                    <p className="text-gray-500">Visão completa do seu atendimento</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="recursos" className="py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-gray-900 mb-4">
                Ferramentas <span className="text-blue-600">Poderosas</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Tudo que você precisa para gerenciar sua instituição com um toque de mágica.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Users className="w-6 h-6" />,
                  title: "Múltiplos Atendentes",
                  desc: "Organize sua equipe e distribua atendimentos.",
                  color: "bg-blue-100 text-blue-600"
                },
                {
                  icon: <Zap className="w-6 h-6" />,
                  title: "Automação com IA",
                  desc: "Respostas automáticas 24/7 para seus alunos.",
                  color: "bg-yellow-100 text-yellow-600"
                },
                {
                  icon: <Smartphone className="w-6 h-6" />,
                  title: "WhatsApp Oficial",
                  desc: "Conexão estável e segura para sua paz de espírito.",
                  color: "bg-green-100 text-green-600"
                },
                {
                  icon: <BarChart3 className="w-6 h-6" />,
                  title: "Relatórios Visuais",
                  desc: "Métricas claras e coloridas para tomada de decisão.",
                  color: "bg-purple-100 text-purple-600"
                },
                {
                  icon: <Shield className="w-6 h-6" />,
                  title: "Segurança Total",
                  desc: "Controle de permissões e proteção de dados.",
                  color: "bg-red-100 text-red-600"
                },
                {
                  icon: <BookOpen className="w-6 h-6" />,
                  title: "Foco no Ensino",
                  desc: "Deixe a burocracia com a gente e foque nos alunos.",
                  color: "bg-pink-100 text-pink-600"
                }
              ].map((feature, i) => (
                <div key={i} className="group bg-white p-8 rounded-3xl shadow-lg shadow-gray-100 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">
              Pronto para começar?
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
              Junte-se a centenas de instituições que já modernizaram sua comunicação de forma divertida e eficiente.
            </p>
            <Link href="#precos">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 h-16 px-10 text-xl font-bold rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200">
                Escolher meu Plano
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-gray-900">FaculZap</span>
            </div>

            <div className="flex gap-8">
              <a href="#" className="text-gray-500 hover:text-blue-600 font-medium transition-colors">Termos</a>
              <a href="#" className="text-gray-500 hover:text-blue-600 font-medium transition-colors">Privacidade</a>
              <a href="#" className="text-gray-500 hover:text-blue-600 font-medium transition-colors">Contato</a>
            </div>

            <p className="text-gray-400 text-sm font-medium">
              © {new Date().getFullYear()} Feito com 💜 para educação
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
