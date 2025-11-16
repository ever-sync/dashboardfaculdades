'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MessageSquare } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { validateEmail, validatePassword } from '@/lib/validations'

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  
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
      router.push('/dashboard')
    } catch {
      showToast('Erro ao conectar ao servidor', 'error')
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Analytics</h1>
            <p className="text-gray-500 mt-2">Faça login para acessar o dashboard</p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors({ ...errors, email: undefined })
              }}
              error={errors.email}
              placeholder="seu@email.com"
              required
            />
            
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors({ ...errors, password: undefined })
              }}
              error={errors.password}
              placeholder="••••••••"
              required
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          {/* Credenciais de Demo */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-medium mb-2">Credenciais de Demo:</p>
            <p className="text-xs text-gray-500">Email: admin@unifatecie.com.br</p>
            <p className="text-xs text-gray-500">Senha: admin123</p>
          </div>
        </div>
      </div>
    </div>
  )
}