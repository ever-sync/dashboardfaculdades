'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { queryClient } from '@/lib/reactQuery'

interface QueryProviderProps {
  children: ReactNode
}

/**
 * Provider do React Query para cache e gerenciamento de estado de servidor
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
