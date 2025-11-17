/**
 * Configuração do React Query para cache e revalidação
 */
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - dados considerados frescos
      gcTime: 1000 * 60 * 30, // 30 minutos - tempo que dados ficam em cache (anteriormente cacheTime)
      retry: 1, // Tentar novamente apenas 1 vez em caso de erro
      refetchOnWindowFocus: false, // Não refazer query ao focar na janela
      refetchOnMount: true, // Refazer query ao montar componente
    },
    mutations: {
      retry: 0, // Não tentar novamente em mutações
    },
  },
})

/**
 * Query keys para organização
 */
export const queryKeys = {
  // Dashboard
  dashboard: {
    stats: (faculdadeId: string) => ['dashboard', 'stats', faculdadeId] as const,
    charts: (faculdadeId: string) => ['dashboard', 'charts', faculdadeId] as const,
  },
  
  // Prospects
  prospects: {
    all: (faculdadeId: string) => ['prospects', faculdadeId] as const,
    list: (faculdadeId: string, page: number, filters: Record<string, unknown>) => 
      ['prospects', faculdadeId, 'list', page, filters] as const,
    detail: (id: string) => ['prospects', 'detail', id] as const,
  },
  
  // Conversas
  conversas: {
    all: (faculdadeId: string) => ['conversas', faculdadeId] as const,
    list: (faculdadeId: string, page: number, filters: Record<string, unknown>) => 
      ['conversas', faculdadeId, 'list', page, filters] as const,
    detail: (id: string) => ['conversas', 'detail', id] as const,
    mensagens: (conversaId: string) => ['conversas', 'mensagens', conversaId] as const,
  },
  
  // Faculdades
  faculdades: {
    all: ['faculdades'] as const,
    detail: (id: string) => ['faculdades', 'detail', id] as const,
  },
  
  // Cursos
  cursos: {
    all: (faculdadeId?: string) => faculdadeId ? ['cursos', faculdadeId] : ['cursos'] as const,
    detail: (id: string) => ['cursos', 'detail', id] as const,
  },
  
  // Agentes IA
  agentesIA: {
    all: (faculdadeId?: string) => faculdadeId ? ['agentes-ia', faculdadeId] : ['agentes-ia'] as const,
    detail: (id: string) => ['agentes-ia', 'detail', id] as const,
  },
  
  // Base de Conhecimento
  baseConhecimento: {
    all: (faculdadeId: string) => ['base-conhecimento', faculdadeId] as const,
    detail: (id: string) => ['base-conhecimento', 'detail', id] as const,
  },
  
  // Relatórios
  relatorios: {
    data: (faculdadeId: string, periodo: string) => 
      ['relatorios', faculdadeId, periodo] as const,
  },
}
