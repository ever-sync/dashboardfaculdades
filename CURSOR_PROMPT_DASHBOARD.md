# 📊 DASHBOARD DE GESTÃO WHATSAPP PARA FACULDADES
## Prompt Técnico Completo para Implementação no Cursor

---

## 1. CONTEXTO DO PROJETO

### Descrição
Sistema multi-tenant de dashboard para gestão de conversas WhatsApp, prospects e métricas para faculdades/instituições de ensino.

### Stack Tecnológica
- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript
- **Banco de Dados:** Supabase (PostgreSQL)
- **UI:** React 19 + Tailwind CSS 4
- **Gráficos:** Recharts 3.4.1
- **Ícones:** Lucide React

### Estrutura do Projeto
```
dashboardfaculdades/
├── app/
│   ├── dashboard/          # Páginas do dashboard
│   │   ├── page.tsx        # Home (KPIs principais)
│   │   ├── prospects/      # Gestão de prospects
│   │   ├── conversas/      # Conversas WhatsApp
│   │   ├── analytics/      # Analytics e gráficos
│   │   └── relatorios/     # Relatórios
│   └── api/                # API Routes
├── src/
│   ├── components/
│   │   ├── ui/             # Componentes UI reutilizáveis
│   │   └── dashboard/      # Componentes específicos
│   ├── lib/
│   │   ├── supabase.ts     # Cliente Supabase
│   │   └── utils.ts        # Utilitários
│   ├── types/
│   │   └── supabase.ts     # TypeScript types
│   └── contexts/
│       ├── FaculdadeContext.tsx
│       ├── ThemeContext.tsx
│       └── ToastContext.tsx
├── supabase/
│   └── migrations/         # Migrações SQL
└── package.json
```

---

## 2. BANCO DE DADOS (ESTRUTURA COMPLETA)

### 2.1 Tabelas Principais

#### `faculdades`
```sql
CREATE TABLE faculdades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    plano VARCHAR(50) DEFAULT 'basico' CHECK (plano IN ('basico', 'pro', 'enterprise')),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
    data_contratacao TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `conversas_whatsapp`
```sql
CREATE TABLE conversas_whatsapp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    telefone VARCHAR(20) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('ativo', 'pendente', 'encerrado')),
    status_conversa VARCHAR(20) CHECK (status_conversa IN ('ativa', 'pendente', 'encerrada')),
    ultima_mensagem TEXT,
    data_ultima_mensagem TIMESTAMPTZ DEFAULT NOW(),
    nao_lidas INTEGER DEFAULT 0,
    departamento VARCHAR(100) NOT NULL,
    setor VARCHAR(100),
    atendente VARCHAR(255),
    prospect_id UUID REFERENCES prospects_academicos(id) ON DELETE SET NULL,
    duracao_segundos INTEGER DEFAULT 0,
    avaliacao_nota INTEGER CHECK (avaliacao_nota >= 0 AND avaliacao_nota <= 5),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `mensagens`
```sql
CREATE TABLE mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversa_id UUID NOT NULL REFERENCES conversas_whatsapp(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    remetente VARCHAR(10) CHECK (remetente IN ('usuario', 'agente', 'bot')),
    tipo_mensagem VARCHAR(20) DEFAULT 'texto' CHECK (tipo_mensagem IN ('texto', 'imagem', 'documento', 'audio', 'video')),
    midia_url TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    lida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `prospects_academicos`
```sql
CREATE TABLE prospects_academicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    status_academico VARCHAR(20) DEFAULT 'novo' CHECK (status_academico IN ('novo', 'contatado', 'qualificado', 'matriculado', 'perdido')),
    curso VARCHAR(255) NOT NULL,
    turno VARCHAR(20) CHECK (turno IN ('manha', 'tarde', 'noite', 'ead')),
    nota_qualificacao INTEGER DEFAULT 0 CHECK (nota_qualificacao >= 0 AND nota_qualificacao <= 100),
    origem VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    ultimo_contato TIMESTAMPTZ DEFAULT NOW(),
    data_matricula TIMESTAMPTZ,
    valor_mensalidade DECIMAL(10, 2),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Tabelas de Métricas

#### `metricas_diarias`
```sql
CREATE TABLE metricas_diarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    total_conversas INTEGER DEFAULT 0,
    conversas_ativas INTEGER DEFAULT 0,
    conversas_finalizadas INTEGER DEFAULT 0,
    novos_prospects INTEGER DEFAULT 0,
    prospects_novos INTEGER DEFAULT 0,
    prospects_convertidos INTEGER DEFAULT 0,
    mensagens_enviadas INTEGER DEFAULT 0,
    mensagens_recebidas INTEGER DEFAULT 0,
    total_mensagens INTEGER DEFAULT 0,
    taxa_automacao_percentual DECIMAL(5, 2) DEFAULT 0,
    tempo_medio_primeira_resposta_segundos INTEGER DEFAULT 0,
    tempo_medio_resposta INTEGER DEFAULT 0,
    tempo_medio_resolucao_minutos INTEGER DEFAULT 0,
    nota_media DECIMAL(3, 2) DEFAULT 0,
    departamento VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(faculdade_id, data, COALESCE(departamento, ''))
);
```

#### `metricas_demograficas`
```sql
CREATE TABLE metricas_demograficas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    total_prospects INTEGER DEFAULT 0,
    total_matriculas INTEGER DEFAULT 0,
    receita_estimada DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(faculdade_id, data, cidade, estado)
);
```

#### `metricas_por_setor`
```sql
CREATE TABLE metricas_por_setor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    setor VARCHAR(100) NOT NULL,
    total_atendimentos INTEGER DEFAULT 0,
    atendimentos_finalizados INTEGER DEFAULT 0,
    tempo_medio_atendimento INTEGER DEFAULT 0,
    avaliacoes_positivas INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(faculdade_id, data, setor)
);
```

#### `metricas_por_horario`
```sql
CREATE TABLE metricas_por_horario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    hora INTEGER NOT NULL CHECK (hora >= 0 AND hora <= 23),
    total_mensagens INTEGER DEFAULT 0,
    total_conversas INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(faculdade_id, data, hora)
);
```

#### `codigos_atendimento`
```sql
CREATE TABLE codigos_atendimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    acao VARCHAR(50) NOT NULL CHECK (acao IN ('pausar_ia', 'ativar_ia', 'transferir', 'solicitar_humano')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `transferencias_setores`
```sql
CREATE TABLE transferencias_setores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    conversa_id UUID NOT NULL REFERENCES conversas_whatsapp(id) ON DELETE CASCADE,
    setor_origem VARCHAR(100) NOT NULL,
    setor_destino VARCHAR(100) NOT NULL,
    motivo TEXT,
    atendente_origem VARCHAR(255),
    atendente_destino VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Relacionamentos (FK)
- `conversas_whatsapp.faculdade_id` → `faculdades.id`
- `mensagens.conversa_id` → `conversas_whatsapp.id`
- `prospects_academicos.faculdade_id` → `faculdades.id`
- `conversas_whatsapp.prospect_id` → `prospects_academicos.id`
- `metricas_diarias.faculdade_id` → `faculdades.id`
- Todas as métricas têm `faculdade_id` → `faculdades.id`

### 2.4 Índices Importantes
```sql
-- Conversas
idx_conversas_faculdade, idx_conversas_status, idx_conversas_departamento
idx_conversas_data_ultima, idx_conversas_status_conversa, idx_conversas_prospect_id

-- Mensagens
idx_mensagens_conversa, idx_mensagens_timestamp, idx_mensagens_remetente

-- Prospects
idx_prospects_faculdade, idx_prospects_status, idx_prospects_curso, idx_prospects_origem

-- Métricas
idx_metricas_faculdade, idx_metricas_data, idx_metricas_departamento
```

---

## 3. ARQUITETURA DO APP

### 3.1 Estrutura de Pastas
```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx           # Home - KPIs principais
│   │   ├── prospects/
│   │   │   └── page.tsx       # Lista e gestão de prospects
│   │   ├── conversas/
│   │   │   └── page.tsx       # Conversas WhatsApp ativas
│   │   ├── analytics/
│   │   │   └── page.tsx       # Analytics e gráficos
│   │   └── relatorios/
│   │       └── page.tsx       # Relatórios exportáveis
│   └── api/                   # API Routes (se necessário)
├── components/
│   ├── ui/                    # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── StatsCard.tsx
│   │   └── index.ts
│   └── dashboard/             # Componentes específicos
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── DashboardCharts.tsx
│       └── index.ts
├── lib/
│   ├── supabase.ts            # Cliente Supabase configurado
│   └── utils.ts               # Funções utilitárias
├── types/
│   └── supabase.ts            # TypeScript interfaces completas
└── contexts/
    ├── FaculdadeContext.tsx   # Context para faculdade selecionada
    ├── ThemeContext.tsx       # Context para tema (dark/light)
    └── ToastContext.tsx       # Context para notificações
```

### 3.2 Fluxo de Dados
1. **Contexto de Faculdade:** Usuário seleciona faculdade → `FaculdadeContext` atualiza
2. **Páginas:** Usam `useFaculdade()` para obter `faculdadeSelecionada`
3. **Queries:** Filtram sempre por `faculdade_id = faculdadeSelecionada.id`
4. **Estado:** Gerenciado localmente com `useState` + `useEffect`
5. **Cache:** Supabase gerencia cache automaticamente

---

## 4. TYPES TYPESCRIPT COMPLETOS

### 4.1 Interfaces Principais

```typescript
// src/types/supabase.ts

export interface Faculdade {
  id: string
  nome: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  logo_url?: string
  plano: 'basico' | 'pro' | 'enterprise'
  status: 'ativo' | 'inativo' | 'suspenso'
  data_contratacao?: string
  created_at: string
  updated_at: string
}

export interface ConversaWhatsApp {
  id: string
  faculdade_id: string
  telefone: string
  nome: string
  status: 'ativo' | 'pendente' | 'encerrado'
  status_conversa?: 'ativa' | 'pendente' | 'encerrada'
  ultima_mensagem?: string
  data_ultima_mensagem: string
  nao_lidas: number
  departamento: string
  setor?: string
  atendente?: string
  prospect_id?: string
  duracao_segundos?: number
  avaliacao_nota?: number
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface Prospect {
  id: string
  faculdade_id: string
  nome: string
  email?: string
  telefone: string
  curso: string
  turno?: 'manha' | 'tarde' | 'noite' | 'ead'
  status_academico: 'novo' | 'contatado' | 'qualificado' | 'matriculado' | 'perdido'
  origem?: string
  cidade?: string
  estado?: string
  ultimo_contato: string
  data_matricula?: string
  valor_mensalidade?: number
  observacoes?: string
  nota_qualificacao: number
  created_at: string
  updated_at: string
}

export interface Mensagem {
  id: string
  conversa_id: string
  conteudo: string
  remetente: 'usuario' | 'agente' | 'bot'
  tipo_mensagem: 'texto' | 'imagem' | 'documento' | 'audio' | 'video'
  midia_url?: string
  timestamp: string
  lida: boolean
  created_at: string
}

export interface MetricaDiaria {
  id: string
  faculdade_id: string
  data: string
  total_conversas: number
  conversas_ativas: number
  conversas_finalizadas?: number
  novos_prospects: number
  prospects_novos?: number
  prospects_convertidos: number
  mensagens_enviadas: number
  mensagens_recebidas: number
  total_mensagens?: number
  taxa_automacao_percentual: number
  nota_media: number
  tempo_medio_primeira_resposta_segundos: number
  tempo_medio_resposta?: number
  tempo_medio_resolucao_minutos?: number
  departamento?: string
  created_at: string
  updated_at?: string
}

export interface MetricaDemografica {
  id: string
  faculdade_id: string
  data: string
  cidade: string
  estado: string
  total_prospects: number
  total_matriculas: number
  receita_estimada: number
  created_at: string
  updated_at: string
}

export interface MetricaPorSetor {
  id: string
  faculdade_id: string
  data: string
  setor: string
  total_atendimentos: number
  atendimentos_finalizados: number
  tempo_medio_atendimento: number
  avaliacoes_positivas: number
  created_at: string
  updated_at: string
}

export interface MetricaPorHorario {
  id: string
  faculdade_id: string
  data: string
  hora: number
  total_mensagens: number
  total_conversas: number
  created_at: string
  updated_at: string
}

export interface CodigoAtendimento {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  acao: 'pausar_ia' | 'ativar_ia' | 'transferir' | 'solicitar_humano'
  created_at: string
  updated_at: string
}

export interface TransferenciaSetor {
  id: string
  faculdade_id: string
  conversa_id: string
  setor_origem: string
  setor_destino: string
  motivo?: string
  atendente_origem?: string
  atendente_destino?: string
  timestamp: string
  created_at: string
}

// Tipos auxiliares
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
```

---

## 5. COMPONENTES A CRIAR/MELHORAR

### 5.1 Componentes UI (já existentes, mas verificar)
- ✅ `Button.tsx` - Botão reutilizável
- ✅ `Card.tsx` - Card container
- ✅ `Input.tsx` - Input de formulário
- ✅ `Badge.tsx` - Badge de status
- ✅ `StatsCard.tsx` - Card de estatísticas
- ✅ `Toast.tsx` - Notificações

### 5.2 Componentes Dashboard

#### `Header.tsx` ✅ (já existe)
```typescript
interface HeaderProps {
  title: string
  subtitle?: string
}
```

#### `Sidebar.tsx` ✅ (já existe)
- Navegação lateral
- Links para todas as páginas
- Indicador de página ativa

#### `DashboardCharts.tsx` ✅ (já existe)
- Gráficos reutilizáveis com Recharts

### 5.3 Páginas do Dashboard

#### 1. `app/dashboard/page.tsx` (Home)
**KPIs principais:**
- Total de conversas ativas
- Total de prospects
- Matrículas do mês
- Receita estimada
- Taxa de conversão
- Taxa de automação
- Tempo médio de resposta
- Satisfação média

**Gráficos:**
- Conversas por dia (últimos 7 dias)
- Funil de conversão
- Distribuição por setor

#### 2. `app/dashboard/prospects/page.tsx` ✅ (existe, mas melhorar)
**Funcionalidades:**
- Lista de prospects com paginação
- Filtros: status, curso, origem
- Busca por nome/telefone/email
- Detalhes do prospect (modal)
- Edição de status e observações

#### 3. `app/dashboard/conversas/page.tsx` ✅ (existe, mas melhorar)
**Funcionalidades:**
- Lista de conversas ativas
- Filtros: status, departamento
- Busca por nome/telefone
- Visualização de mensagens
- Envio de mensagens (se implementado)

#### 4. `app/dashboard/analytics/page.tsx` ✅ (existe, mas melhorar)
**Gráficos:**
- Conversas por hora do dia
- Evolução semanal
- Distribuição por setores (pizza)
- Funil de conversão
- Métricas demográficas (mapa/tabela)

#### 5. `app/dashboard/relatorios/page.tsx`
**Funcionalidades:**
- Exportação de relatórios (CSV, PDF)
- Filtros por período
- Métricas consolidadas
- Gráficos exportáveis

---

## 6. HOOKS CUSTOMIZADOS

### 6.1 `useProspects.ts`
```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Prospect } from '@/types/supabase'

export function useProspects(faculdadeId: string | null) {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProspects = useCallback(async () => {
    if (!faculdadeId) {
      setProspects([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('prospects_academicos')
        .select('*')
        .eq('faculdade_id', faculdadeId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProspects(data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      setProspects([])
    } finally {
      setLoading(false)
    }
  }, [faculdadeId])

  useEffect(() => {
    fetchProspects()
  }, [fetchProspects])

  return {
    prospects,
    loading,
    error,
    refetch: fetchProspects
  }
}
```

### 6.2 `useConversas.ts`
```typescript
export function useConversas(faculdadeId: string | null) {
  const [conversas, setConversas] = useState<ConversaWhatsApp[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConversas = useCallback(async () => {
    if (!faculdadeId) return

    const { data, error } = await supabase
      .from('conversas_whatsapp')
      .select('*')
      .eq('faculdade_id', faculdadeId)
      .order('data_ultima_mensagem', { ascending: false })

    if (error) throw error
    setConversas(data || [])
  }, [faculdadeId])

  // ... implementação similar
}
```

### 6.3 `useMetricas.ts`
```typescript
export function useMetricas(faculdadeId: string | null, periodo: '7d' | '30d' | '90d' = '30d') {
  const [metricas, setMetricas] = useState<MetricaDiaria[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMetricas = useCallback(async () => {
    if (!faculdadeId) return

    const dias = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - dias)

    const { data, error } = await supabase
      .from('metricas_diarias')
      .select('*')
      .eq('faculdade_id', faculdadeId)
      .gte('data', dataInicio.toISOString().split('T')[0])
      .order('data', { ascending: false })

    if (error) throw error
    setMetricas(data || [])
  }, [faculdadeId, periodo])

  // ... implementação
}
```

---

## 7. QUERIES SUPABASE

### 7.1 Buscar Prospects
```typescript
// Todos os prospects
const { data } = await supabase
  .from('prospects_academicos')
  .select('*')
  .eq('faculdade_id', faculdadeId)

// Prospects por status
const { data } = await supabase
  .from('prospects_academicos')
  .select('*')
  .eq('faculdade_id', faculdadeId)
  .eq('status_academico', 'novo')

// Prospects com paginação
const { data, count } = await supabase
  .from('prospects_academicos')
  .select('*', { count: 'exact' })
  .eq('faculdade_id', faculdadeId)
  .range(0, 19) // Primeira página
```

### 7.2 Buscar Conversas
```typescript
// Conversas ativas
const { data } = await supabase
  .from('conversas_whatsapp')
  .select('*')
  .eq('faculdade_id', faculdadeId)
  .eq('status', 'ativo')

// Conversas com mensagens não lidas
const { data } = await supabase
  .from('conversas_whatsapp')
  .select('*')
  .eq('faculdade_id', faculdadeId)
  .gt('nao_lidas', 0)

// Conversas por departamento
const { data } = await supabase
  .from('conversas_whatsapp')
  .select('*')
  .eq('faculdade_id', faculdadeId)
  .eq('departamento', 'Admissões')
```

### 7.3 Buscar Mensagens de uma Conversa
```typescript
const { data } = await supabase
  .from('mensagens')
  .select('*')
  .eq('conversa_id', conversaId)
  .order('timestamp', { ascending: true })
```

### 7.4 Buscar Métricas
```typescript
// Métricas diárias
const { data } = await supabase
  .from('metricas_diarias')
  .select('*')
  .eq('faculdade_id', faculdadeId)
  .gte('data', '2024-01-01')
  .order('data', { ascending: false })

// Métricas por horário
const { data } = await supabase
  .from('metricas_por_horario')
  .select('*')
  .eq('faculdade_id', faculdadeId)
  .eq('data', '2024-01-15')

// Métricas por setor
const { data } = await supabase
  .from('metricas_por_setor')
  .select('*')
  .eq('faculdade_id', faculdadeId)
  .gte('data', '2024-01-01')
```

### 7.5 Estatísticas Agregadas
```typescript
// Contar prospects por status
const { data } = await supabase
  .from('prospects_academicos')
  .select('status_academico')
  .eq('faculdade_id', faculdadeId)

// Calcular taxa de conversão
const { data: metricas } = await supabase
  .from('metricas_diarias')
  .select('prospects_convertidos, novos_prospects')
  .eq('faculdade_id', faculdadeId)
  .gte('data', dataInicio)
```

---

## 8. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Setup e Configuração
- [x] Estrutura de pastas criada
- [x] Cliente Supabase configurado
- [x] Types TypeScript criados
- [x] Contexts configurados (Faculdade, Theme, Toast)

### Fase 2: Componentes Base
- [x] Componentes UI reutilizáveis
- [x] Header e Sidebar
- [ ] Componentes de gráficos (melhorar)

### Fase 3: Hooks Customizados
- [ ] `useProspects.ts`
- [ ] `useConversas.ts`
- [ ] `useMetricas.ts`
- [ ] `useMensagens.ts`

### Fase 4: Páginas do Dashboard
- [x] Home (`page.tsx`) - Melhorar KPIs
- [x] Prospects (`prospects/page.tsx`) - Ajustar queries
- [x] Conversas (`conversas/page.tsx`) - Ajustar queries
- [x] Analytics (`analytics/page.tsx`) - Melhorar gráficos
- [ ] Relatórios (`relatorios/page.tsx`) - Criar do zero

### Fase 5: Funcionalidades Avançadas
- [ ] Busca e filtros avançados
- [ ] Paginação completa
- [ ] Exportação de dados (CSV, PDF)
- [ ] Real-time updates (Supabase Realtime)

### Fase 6: Testes e Otimização
- [ ] Testes unitários
- [ ] Testes E2E (Playwright)
- [ ] Otimização de queries
- [ ] Loading states e error handling

---

## 9. PADRÕES DE CÓDIGO

### 9.1 Nomenclatura
- **Componentes:** PascalCase (`ProspectsPage.tsx`)
- **Hooks:** camelCase com prefixo `use` (`useProspects.ts`)
- **Types:** PascalCase (`Prospect`, `ConversaWhatsApp`)
- **Arquivos:** kebab-case ou PascalCase

### 9.2 Estrutura de Componentes
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'

export default function ProspectsPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProspects = useCallback(async () => {
    // ... lógica
  }, [faculdadeSelecionada])

  useEffect(() => {
    if (faculdadeSelecionada) {
      fetchProspects()
    }
  }, [faculdadeSelecionada, fetchProspects])

  if (loading) return <div>Carregando...</div>

  return (
    // ... JSX
  )
}
```

### 9.3 Error Handling
```typescript
try {
  const { data, error } = await supabase
    .from('prospects_academicos')
    .select('*')

  if (error) throw error
  setProspects(data || [])
} catch (error: any) {
  console.error('Erro ao buscar prospects:', error)
  // Mostrar toast de erro
}
```

### 9.4 Loading States
```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
}
```

---

## 10. NOTAS IMPORTANTES

### 10.1 Multi-tenant
- **SEMPRE** filtrar por `faculdade_id`
- Usar `faculdadeSelecionada.id` do contexto
- Validar que `faculdadeSelecionada` existe antes de fazer queries

### 10.2 Performance
- Usar paginação para listas grandes
- Implementar debounce em buscas
- Cache de queries quando possível
- Lazy loading de componentes pesados

### 10.3 Segurança
- Row Level Security (RLS) habilitado no Supabase
- Validar dados no cliente e servidor
- Sanitizar inputs do usuário

### 10.4 Responsividade
- Mobile-first com Tailwind
- Testar em diferentes tamanhos de tela
- Usar `ResponsiveContainer` do Recharts

---

## 11. PRÓXIMOS PASSOS

1. **Revisar e ajustar páginas existentes** conforme este documento
2. **Criar hooks customizados** para reutilização
3. **Melhorar gráficos** na página de analytics
4. **Implementar página de relatórios** completa
5. **Adicionar testes** para funcionalidades críticas
6. **Otimizar queries** e adicionar cache

---

## 📌 INSTRUÇÕES PARA O CURSOR

Ao usar este documento no Cursor:

1. **Leia completamente** antes de começar
2. **Siga a ordem do checklist** (Fase 1 → Fase 6)
3. **Use os types** de `src/types/supabase.ts`
4. **Respeite os relacionamentos FK** ao fazer joins
5. **Sempre filtre por `faculdade_id`**
6. **Mantenha consistência** com o código existente
7. **Teste cada funcionalidade** antes de prosseguir

**Comandos úteis:**
```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Testes
npm test
npm run test:e2e
```

---

**Documento criado em:** 2024-11-XX  
**Versão:** 1.0  
**Última atualização:** Com todas as mudanças de mensagens e métricas

