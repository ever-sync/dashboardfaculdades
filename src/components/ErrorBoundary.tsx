'use client'

import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary para capturar erros de renderização
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log do erro para monitoramento
    console.error('ErrorBoundary capturou um erro:', error, errorInfo)
    
    // Aqui você pode enviar o erro para um serviço de monitoramento
    // Ex: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Algo deu errado
            </h1>
            
            <p className="text-gray-600 mb-4">
              Ocorreu um erro inesperado. Por favor, tente recarregar a página.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <p className="text-sm font-mono text-red-800 break-words">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">
                      Ver detalhes técnicos
                    </summary>
                    <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="primary"
                className="inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </Button>
              
              <Button
                onClick={() => window.history.back()}
                variant="secondary"
              >
                Voltar
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
