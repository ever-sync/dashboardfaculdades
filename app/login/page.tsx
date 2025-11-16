'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MessageSquare, Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { validateEmail, validatePassword } from '@/lib/validations'

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  
  // Obter redirect da URL se existir
  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('redirect') || '/dashboard'
    }
    return '/dashboard'
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    const emailValidation = validateEmail(email)
    const passwordValidation = validatePassword(password)
    
    const newErrors: { email?: string; password?: string } = {}
    if (!emailValidation.isValid) newErrors.email = emailValidation.error
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.error
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      showToast('Por favor, corrija os erros no formulário', 'error')
      return
    }
    
    setLoading(true)
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        showToast(data.error || 'Erro ao fazer login', 'error')
        setLoading(false)
        return
      }
      
      showToast('Login realizado com sucesso!', 'success')
      
      // Redirecionar para a URL original ou dashboard
      const redirectUrl = getRedirectUrl()
      router.push(redirectUrl)
      
      // Forçar reload para garantir que os cookies sejam lidos
      setTimeout(() => {
        window.location.href = redirectUrl
      }, 100)
    } catch {
      showToast('Erro ao conectar ao servidor', 'error')
      setLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail('admin@unifatecie.com.br')
    setPassword('admin123')
    setShowDemo(false)
  }
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card de Login */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl mb-6 shadow-lg">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-black mb-2">
              WhatsApp Analytics
            </h1>
            <p className="text-gray-600 text-sm">Faça login para acessar o dashboard</p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors({ ...errors, email: undefined })
                  }}
                  placeholder="seu@email.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <span>•</span> {errors.email}
                </p>
              )}
            </div>
            
            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors({ ...errors, password: undefined })
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <span>•</span> {errors.password}
                </p>
              )}
            </div>

            {/* Esqueci minha senha */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                onClick={() => showToast('Funcionalidade em desenvolvimento', 'info')}
              >
                Esqueci minha senha
              </button>
            </div>
            
            {/* Botão de Login */}
            <Button
              type="submit"
              className="w-full py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
          
          {/* Credenciais de Demo */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">Credenciais de Demo</span>
              </span>
              <span className={`transform transition-transform ${showDemo ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {showDemo && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs text-gray-700 font-medium mb-3">Use estas credenciais para testar:</p>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Email:</span>
                    <code className="text-xs bg-white px-2 py-1 rounded font-mono text-gray-800">admin@unifatecie.com.br</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Senha:</span>
                    <code className="text-xs bg-white px-2 py-1 rounded font-mono text-gray-800">admin123</code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="w-full mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Preencher automaticamente</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              © 2024 WhatsApp Analytics Dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}