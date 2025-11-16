'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Toast, ToastType } from '@/components/ui/Toast'

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  toasts: Toast[]
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 5000) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      message,
      type,
      duration,
    }

    setToasts((prev) => [...prev, newToast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Fallback para quando não há provider
    return {
      showToast: () => {},
      toasts: [],
      removeToast: () => {},
    }
  }
  return context
}

