'use client'

import { useToast } from '@/contexts/ToastContext'
import { ToastContainer } from './ToastContainer'

export function ToastContextWrapper() {
  const { toasts, removeToast } = useToast()

  return <ToastContainer toasts={toasts} onClose={removeToast} />
}

