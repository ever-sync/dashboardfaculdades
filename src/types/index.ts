export interface DashboardStats {
  total_conversas: number
  total_prospects: number
  matriculas_mes: number
  receita_mes: number
  taxa_conversao: number
  taxa_automacao: number
  tempo_medio_resposta: number
  satisfacao_media: number
}

export interface User {
  id: number
  email: string
  name: string
}