# 📋 INSTRUÇÕES COMPLETAS - Dashboard WhatsApp Analytics

## 🎯 OBJETIVO
Finalizar o dashboard de analytics para gerenciamento de faculdades (clientes) com automação WhatsApp. O sistema deve funcionar com dados reais do Supabase e incluir gestão multi-tenant.

EXECUTAR
---

## 📚 CONTEXTO DO PROJETO

### Tecnologias Utilizadas
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Banco de Dados:** Supabase (PostgreSQL)
- **Gráficos:** Recharts
- **Ícones:** Lucide React

### Estrutura Atual
```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx (Dashboard principal)
│   │   ├── analytics/page.tsx (Analytics)
│   │   ├── conversas/page.tsx (Conversas WhatsApp)
│   │   ├── prospects/page.tsx (Gestão de Leads)
│   │   └── relatorios/page.tsx (Relatórios)
│   └── api/
│       └── dashboard/
│           └── stats/route.ts (API de estatísticas)
├── components/
│   ├── ui/ (Componentes básicos)
│   └── dashboard/ (Header, etc)
├── lib/
│   └── supabase.ts (Cliente Supabase)
└── types/
    ├── index.ts
    └── supabase.ts
```

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. Divergência de Nomenclatura de Tabelas
**Problema:** Inconsistência entre tabelas locais (inglês) e remotas (português)

**Tabelas Locais (migrations):**
- `conversations`
- `prospects`
- `analytics_stats`

**Tabelas Remotas (Supabase atual):**
- `conversas_whatsapp`
- `prospects_academicos`
- `metricas_diarias`

**Solução:** Padronizar para português (já está no Supabase remoto)

### 2. Dados Zerados
**Problema:** Dashboard mostra valores 0 porque não há dados populados

**Solução:** Criar script de seed para popular dados de exemplo

### 3. Sistema Multi-tenant Incompleto
**Problema:** Falta gestão de faculdades/clientes

**Solução:** Implementar tabela de faculdades e seletor no dashboard

---

## ✅ TAREFAS A EXECUTAR

### FASE 1: Alinhamento do Banco de Dados

#### 1.1 - Criar Migration para Tabelas em Português

**Arquivo:** `supabase/migrations/002_create_tables_pt.sql`

```sql
-- =============================================
-- TABELA: faculdades (clientes do sistema)
-- =============================================
CREATE TABLE IF NOT EXISTS faculdades (
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

CREATE INDEX idx_faculdades_status ON faculdades(status);
CREATE INDEX idx_faculdades_plano ON faculdades(plano);

-- =============================================
-- TABELA: conversas_whatsapp
-- =============================================
CREATE TABLE IF NOT EXISTS conversas_whatsapp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    telefone VARCHAR(20) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('ativo', 'pendente', 'encerrado')),
    ultima_mensagem TEXT,
    data_ultima_mensagem TIMESTAMPTZ DEFAULT NOW(),
    nao_lidas INTEGER DEFAULT 0,
    departamento VARCHAR(100) NOT NULL,
    atendente VARCHAR(255),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversas_faculdade ON conversas_whatsapp(faculdade_id);
CREATE INDEX idx_conversas_status ON conversas_whatsapp(status);
CREATE INDEX idx_conversas_departamento ON conversas_whatsapp(departamento);
CREATE INDEX idx_conversas_data_ultima ON conversas_whatsapp(data_ultima_mensagem);

-- =============================================
-- TABELA: mensagens
-- =============================================
CREATE TABLE IF NOT EXISTS mensagens (
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

CREATE INDEX idx_mensagens_conversa ON mensagens(conversa_id);
CREATE INDEX idx_mensagens_timestamp ON mensagens(timestamp);
CREATE INDEX idx_mensagens_remetente ON mensagens(remetente);

-- =============================================
-- TABELA: prospects_academicos
-- =============================================
CREATE TABLE IF NOT EXISTS prospects_academicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    status_academico VARCHAR(20) DEFAULT 'novo' CHECK (status_academico IN ('novo', 'contatado', 'qualificado', 'matriculado', 'perdido')),
    curso VARCHAR(255) NOT NULL,
    turno VARCHAR(20) CHECK (turno IN ('manha', 'tarde', 'noite', 'ead')),
    nota_qualificacao INTEGER DEFAULT 0 CHECK (nota_qualificacao >= 0 AND nota_qualificacao <= 100),
    origem VARCHAR(100), -- WhatsApp, Site, Facebook, etc
    ultimo_contato TIMESTAMPTZ DEFAULT NOW(),
    data_matricula TIMESTAMPTZ,
    valor_mensalidade DECIMAL(10, 2),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prospects_faculdade ON prospects_academicos(faculdade_id);
CREATE INDEX idx_prospects_status ON prospects_academicos(status_academico);
CREATE INDEX idx_prospects_curso ON prospects_academicos(curso);
CREATE INDEX idx_prospects_origem ON prospects_academicos(origem);

-- =============================================
-- TABELA: metricas_diarias
-- =============================================
CREATE TABLE IF NOT EXISTS metricas_diarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    total_conversas INTEGER DEFAULT 0,
    conversas_ativas INTEGER DEFAULT 0,
    novos_prospects INTEGER DEFAULT 0,
    prospects_convertidos INTEGER DEFAULT 0,
    mensagens_enviadas INTEGER DEFAULT 0,
    mensagens_recebidas INTEGER DEFAULT 0,
    taxa_automacao_percentual DECIMAL(5, 2) DEFAULT 0,
    tempo_medio_primeira_resposta_segundos INTEGER DEFAULT 0,
    tempo_medio_resolucao_minutos INTEGER DEFAULT 0,
    nota_media DECIMAL(3, 2) DEFAULT 0,
    departamento VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(faculdade_id, data, departamento)
);

CREATE INDEX idx_metricas_faculdade ON metricas_diarias(faculdade_id);
CREATE INDEX idx_metricas_data ON metricas_diarias(data);
CREATE INDEX idx_metricas_departamento ON metricas_diarias(departamento);

-- =============================================
-- TABELA: transferencias_setores
-- =============================================
CREATE TABLE IF NOT EXISTS transferencias_setores (
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

CREATE INDEX idx_transferencias_faculdade ON transferencias_setores(faculdade_id);
CREATE INDEX idx_transferencias_conversa ON transferencias_setores(conversa_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE faculdades ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects_academicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencias_setores ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar conforme autenticação)
CREATE POLICY "Acesso público para leitura" ON faculdades FOR SELECT USING (true);
CREATE POLICY "Acesso público para leitura" ON conversas_whatsapp FOR SELECT USING (true);
CREATE POLICY "Acesso público para leitura" ON mensagens FOR SELECT USING (true);
CREATE POLICY "Acesso público para leitura" ON prospects_academicos FOR SELECT USING (true);
CREATE POLICY "Acesso público para leitura" ON metricas_diarias FOR SELECT USING (true);
CREATE POLICY "Acesso público para leitura" ON transferencias_setores FOR SELECT USING (true);
```

#### 1.2 - Criar Script de Seed (Dados de Exemplo)

**Arquivo:** `supabase/seed.sql`

```sql
-- =============================================
-- SEED: Dados de Exemplo para Desenvolvimento
-- =============================================

-- Limpar dados anteriores (cuidado em produção!)
TRUNCATE TABLE transferencias_setores CASCADE;
TRUNCATE TABLE metricas_diarias CASCADE;
TRUNCATE TABLE mensagens CASCADE;
TRUNCATE TABLE prospects_academicos CASCADE;
TRUNCATE TABLE conversas_whatsapp CASCADE;
TRUNCATE TABLE faculdades CASCADE;

-- =============================================
-- FACULDADES
-- =============================================
INSERT INTO faculdades (id, nome, cnpj, telefone, email, plano, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'UniFatecie', '12.345.678/0001-90', '(41) 3333-4444', 'contato@unifatecie.edu.br', 'enterprise', 'ativo'),
('550e8400-e29b-41d4-a716-446655440002', 'Faculdade Nova Era', '98.765.432/0001-10', '(11) 9999-8888', 'contato@novaera.edu.br', 'pro', 'ativo'),
('550e8400-e29b-41d4-a716-446655440003', 'Instituto de Tecnologia', '11.222.333/0001-44', '(21) 8888-7777', 'ti@institutotech.edu.br', 'basico', 'ativo');

-- =============================================
-- CONVERSAS WHATSAPP
-- =============================================
INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, status, ultima_mensagem, data_ultima_mensagem, nao_lidas, departamento, atendente) VALUES
-- UniFatecie
('550e8400-e29b-41d4-a716-446655440001', '41987654321', 'Maria Silva', 'ativo', 'Gostaria de informações sobre o curso de Engenharia', NOW() - INTERVAL '2 hours', 0, 'Admissões', 'Elisangela'),
('550e8400-e29b-41d4-a716-446655440001', '41987654322', 'João Santos', 'pendente', 'Qual o valor da mensalidade?', NOW() - INTERVAL '5 hours', 2, 'Financeiro', NULL),
('550e8400-e29b-41d4-a716-446655440001', '41987654323', 'Ana Paula', 'ativo', 'Preciso de informações sobre bolsas', NOW() - INTERVAL '1 day', 0, 'Financeiro', 'Carlos'),
('550e8400-e29b-41d4-a716-446655440001', '41987654324', 'Pedro Costa', 'encerrado', 'Obrigado pela atenção!', NOW() - INTERVAL '3 days', 0, 'Admissões', 'Elisangela'),
('550e8400-e29b-41d4-a716-446655440001', '41987654325', 'Carla Lima', 'ativo', 'Quando começam as aulas?', NOW() - INTERVAL '30 minutes', 1, 'Secretaria', NULL),
-- Faculdade Nova Era
('550e8400-e29b-41d4-a716-446655440002', '11912345678', 'Roberto Alves', 'ativo', 'Interesse em Administração', NOW() - INTERVAL '1 hour', 0, 'Admissões', 'Julia'),
('550e8400-e29b-41d4-a716-446655440002', '11912345679', 'Fernanda Souza', 'pendente', 'Documentos necessários?', NOW() - INTERVAL '4 hours', 3, 'Secretaria', NULL),
-- Instituto de Tecnologia
('550e8400-e29b-41d4-a716-446655440003', '21998877665', 'Lucas Martins', 'ativo', 'Curso de Ciência da Computação', NOW() - INTERVAL '45 minutes', 0, 'Admissões', 'Marcos');

-- =============================================
-- MENSAGENS
-- =============================================
INSERT INTO mensagens (conversa_id, conteudo, remetente, tipo_mensagem, timestamp) 
SELECT 
    c.id,
    CASE 
        WHEN random() < 0.5 THEN 'Olá! Como posso ajudar?'
        ELSE 'Obrigado pelo contato!'
    END,
    CASE 
        WHEN random() < 0.3 THEN 'bot'
        WHEN random() < 0.6 THEN 'agente'
        ELSE 'usuario'
    END,
    'texto',
    NOW() - (random() * INTERVAL '7 days')
FROM conversas_whatsapp c
CROSS JOIN generate_series(1, 5);

-- =============================================
-- PROSPECTS ACADÊMICOS
-- =============================================
INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status_academico, curso, turno, nota_qualificacao, origem, valor_mensalidade) VALUES
-- UniFatecie
('550e8400-e29b-41d4-a716-446655440001', 'Maria Silva', '41987654321', 'maria.silva@email.com', 'qualificado', 'Engenharia Civil', 'noite', 85, 'WhatsApp', 1200.00),
('550e8400-e29b-41d4-a716-446655440001', 'João Santos', '41987654322', 'joao.santos@email.com', 'contatado', 'Administração', 'noite', 60, 'WhatsApp', 850.00),
('550e8400-e29b-41d4-a716-446655440001', 'Ana Paula', '41987654323', 'ana.paula@email.com', 'qualificado', 'Direito', 'tarde', 90, 'Site', 1500.00),
('550e8400-e29b-41d4-a716-446655440001', 'Pedro Costa', '41987654324', 'pedro.costa@email.com', 'matriculado', 'Medicina', 'manha', 95, 'Indicação', 8000.00),
('550e8400-e29b-41d4-a716-446655440001', 'Carla Lima', '41987654325', 'carla.lima@email.com', 'novo', 'Psicologia', 'tarde', 70, 'Facebook', 950.00),
('550e8400-e29b-41d4-a716-446655440001', 'Bruno Dias', '41987654326', 'bruno.dias@email.com', 'matriculado', 'Engenharia Civil', 'noite', 88, 'WhatsApp', 1200.00),
('550e8400-e29b-41d4-a716-446655440001', 'Julia Mendes', '41987654327', 'julia.mendes@email.com', 'perdido', 'Enfermagem', 'manha', 45, 'Instagram', 1100.00),
-- Faculdade Nova Era
('550e8400-e29b-41d4-a716-446655440002', 'Roberto Alves', '11912345678', 'roberto.alves@email.com', 'qualificado', 'Administração', 'noite', 75, 'WhatsApp', 800.00),
('550e8400-e29b-41d4-a716-446655440002', 'Fernanda Souza', '11912345679', 'fernanda.souza@email.com', 'novo', 'Marketing', 'ead', 55, 'Site', 450.00),
('550e8400-e29b-41d4-a716-446655440002', 'Gustavo Lima', '11912345680', 'gustavo.lima@email.com', 'matriculado', 'Gestão de RH', 'noite', 82, 'WhatsApp', 700.00),
-- Instituto de Tecnologia
('550e8400-e29b-41d4-a716-446655440003', 'Lucas Martins', '21998877665', 'lucas.martins@email.com', 'contatado', 'Ciência da Computação', 'noite', 92, 'WhatsApp', 1300.00);

-- =============================================
-- MÉTRICAS DIÁRIAS (últimos 30 dias)
-- =============================================
INSERT INTO metricas_diarias (faculdade_id, data, total_conversas, conversas_ativas, novos_prospects, prospects_convertidos, 
                               mensagens_enviadas, mensagens_recebidas, taxa_automacao_percentual, 
                               tempo_medio_primeira_resposta_segundos, nota_media, departamento)
SELECT 
    f.id,
    current_date - (g * INTERVAL '1 day'),
    floor(random() * 50 + 20)::INTEGER,
    floor(random() * 30 + 10)::INTEGER,
    floor(random() * 15 + 5)::INTEGER,
    floor(random() * 8 + 1)::INTEGER,
    floor(random() * 200 + 50)::INTEGER,
    floor(random() * 180 + 40)::INTEGER,
    (random() * 30 + 60)::DECIMAL(5,2),
    floor(random() * 120 + 30)::INTEGER,
    (random() * 2 + 3)::DECIMAL(3,2),
    CASE 
        WHEN random() < 0.33 THEN 'Admissões'
        WHEN random() < 0.66 THEN 'Financeiro'
        ELSE 'Secretaria'
    END
FROM faculdades f
CROSS JOIN generate_series(0, 29) g;

-- =============================================
-- TRANSFERÊNCIAS DE SETORES
-- =============================================
INSERT INTO transferencias_setores (faculdade_id, conversa_id, setor_origem, setor_destino, motivo, timestamp)
SELECT 
    c.faculdade_id,
    c.id,
    'Admissões',
    'Financeiro',
    'Cliente solicitou informações sobre bolsas e financiamento',
    NOW() - (random() * INTERVAL '7 days')
FROM conversas_whatsapp c
WHERE random() < 0.3
LIMIT 5;
```

---

### FASE 2: Atualizar Código da Aplicação

#### 2.1 - Atualizar Types do Supabase

**Arquivo:** `src/types/supabase.ts`

```typescript
export interface Faculdade {
  id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  logo_url?: string;
  plano: 'basico' | 'pro' | 'enterprise';
  status: 'ativo' | 'inativo' | 'suspenso';
  data_contratacao: string;
  created_at: string;
  updated_at: string;
}

export interface ConversaWhatsApp {
  id: string;
  faculdade_id: string;
  telefone: string;
  nome: string;
  status: 'ativo' | 'pendente' | 'encerrado';
  ultima_mensagem?: string;
  data_ultima_mensagem: string;
  nao_lidas: number;
  departamento: string;
  atendente?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Mensagem {
  id: string;
  conversa_id: string;
  conteudo: string;
  remetente: 'usuario' | 'agente' | 'bot';
  tipo_mensagem: 'texto' | 'imagem' | 'documento' | 'audio' | 'video';
  midia_url?: string;
  timestamp: string;
  lida: boolean;
  created_at: string;
}

export interface ProspectAcademico {
  id: string;
  faculdade_id: string;
  nome: string;
  telefone: string;
  email?: string;
  status_academico: 'novo' | 'contatado' | 'qualificado' | 'matriculado' | 'perdido';
  curso: string;
  turno?: 'manha' | 'tarde' | 'noite' | 'ead';
  nota_qualificacao: number;
  origem?: string;
  ultimo_contato: string;
  data_matricula?: string;
  valor_mensalidade?: number;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface MetricaDiaria {
  id: string;
  faculdade_id: string;
  data: string;
  total_conversas: number;
  conversas_ativas: number;
  novos_prospects: number;
  prospects_convertidos: number;
  mensagens_enviadas: number;
  mensagens_recebidas: number;
  taxa_automacao_percentual: number;
  tempo_medio_primeira_resposta_segundos: number;
  tempo_medio_resolucao_minutos: number;
  nota_media: number;
  departamento?: string;
  created_at: string;
}

export interface TransferenciaSetor {
  id: string;
  faculdade_id: string;
  conversa_id: string;
  setor_origem: string;
  setor_destino: string;
  motivo?: string;
  atendente_origem?: string;
  atendente_destino?: string;
  timestamp: string;
}
```

#### 2.2 - Criar Context para Faculdade Selecionada

**Arquivo:** `src/contexts/FaculdadeContext.tsx`

```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Faculdade } from '@/types/supabase';

interface FaculdadeContextType {
  faculdadeSelecionada: Faculdade | null;
  faculdades: Faculdade[];
  setFaculdadeSelecionada: (faculdade: Faculdade) => void;
  loading: boolean;
}

const FaculdadeContext = createContext<FaculdadeContextType | undefined>(undefined);

export function FaculdadeProvider({ children }: { children: ReactNode }) {
  const [faculdades, setFaculdades] = useState<Faculdade[]>([]);
  const [faculdadeSelecionada, setFaculdadeSelecionada] = useState<Faculdade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarFaculdades();
  }, []);

  async function carregarFaculdades() {
    try {
      const { data, error } = await supabase
        .from('faculdades')
        .select('*')
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;

      setFaculdades(data || []);
      
      // Selecionar primeira faculdade por padrão
      if (data && data.length > 0 && !faculdadeSelecionada) {
        setFaculdadeSelecionada(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar faculdades:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <FaculdadeContext.Provider value={{ 
      faculdadeSelecionada, 
      faculdades, 
      setFaculdadeSelecionada,
      loading 
    }}>
      {children}
    </FaculdadeContext.Provider>
  );
}

export function useFaculdade() {
  const context = useContext(FaculdadeContext);
  if (context === undefined) {
    throw new Error('useFaculdade deve ser usado dentro de FaculdadeProvider');
  }
  return context;
}
```

#### 2.3 - Adicionar Provider no Layout

**Arquivo:** `src/app/dashboard/layout.tsx`

```typescript
import { FaculdadeProvider } from '@/contexts/FaculdadeContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FaculdadeProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </FaculdadeProvider>
  );
}
```

#### 2.4 - Criar Componente Seletor de Faculdade

**Arquivo:** `src/components/dashboard/FaculdadeSelector.tsx`

```typescript
'use client';

import { useFaculdade } from '@/contexts/FaculdadeContext';
import { Building2, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function FaculdadeSelector() {
  const { faculdadeSelecionada, faculdades, setFaculdadeSelecionada } = useFaculdade();
  const [isOpen, setIsOpen] = useState(false);

  if (!faculdadeSelecionada) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Building2 className="w-5 h-5 text-blue-600" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">
            {faculdadeSelecionada.nome}
          </span>
          <span className="text-xs text-gray-500">
            Plano {faculdadeSelecionada.plano}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            {faculdades.map((faculdade) => (
              <button
                key={faculdade.id}
                onClick={() => {
                  setFaculdadeSelecionada(faculdade);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  faculdade.id === faculdadeSelecionada.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {faculdade.nome}
                    </div>
                    <div className="text-xs text-gray-500">
                      {faculdade.plano} • {faculdade.status}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

#### 2.5 - Atualizar Header para incluir Seletor

**Arquivo:** `src/components/dashboard/Header.tsx`

```typescript
'use client';

import { Search, Bell } from 'lucide-react';
import FaculdadeSelector from './FaculdadeSelector';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Seletor de Faculdade */}
        <FaculdadeSelector />

        {/* Busca */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Notificações */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-6 h-6 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
```

#### 2.6 - Atualizar API de Stats para filtrar por Faculdade

**Arquivo:** `src/app/api/dashboard/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const faculdadeId = searchParams.get('faculdade_id');

    if (!faculdadeId) {
      return NextResponse.json({ error: 'faculdade_id é obrigatório' }, { status: 400 });
    }

    // Total de conversas
    const { count: totalConversas } = await supabase
      .from('conversas_whatsapp')
      .select('*', { count: 'exact', head: true })
      .eq('faculdade_id', faculdadeId);

    // Total de prospects
    const { count: totalProspects } = await supabase
      .from('prospects_academicos')
      .select('*', { count: 'exact', head: true })
      .eq('faculdade_id', faculdadeId);

    // Matrículas do mês
    const primeiroDiaMes = new Date();
    primeiroDiaMes.setDate(1);
    primeiroDiaMes.setHours(0, 0, 0, 0);

    const { count: matriculasMes } = await supabase
      .from('prospects_academicos')
      .select('*', { count: 'exact', head: true })
      .eq('faculdade_id', faculdadeId)
      .eq('status_academico', 'matriculado')
      .gte('data_matricula', primeiroDiaMes.toISOString());

    // Receita do mês (soma das mensalidades dos matriculados)
    const { data: matriculados } = await supabase
      .from('prospects_academicos')
      .select('valor_mensalidade')
      .eq('faculdade_id', faculdadeId)
      .eq('status_academico', 'matriculado')
      .gte('data_matricula', primeiroDiaMes.toISOString());

    const receitaMes = matriculados?.reduce((sum, p) => sum + (p.valor_mensalidade || 0), 0) || 0;

    // Métricas agregadas dos últimos 30 dias
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const { data: metricas } = await supabase
      .from('metricas_diarias')
      .select('*')
      .eq('faculdade_id', faculdadeId)
      .gte('data', trintaDiasAtras.toISOString().split('T')[0]);

    // Calcular médias
    const taxaConversao = totalProspects && matriculasMes 
      ? (matriculasMes / totalProspects) * 100 
      : 0;

    const taxaAutomacao = metricas?.length 
      ? metricas.reduce((sum, m) => sum + m.taxa_automacao_percentual, 0) / metricas.length 
      : 0;

    const tempoMedioResposta = metricas?.length
      ? metricas.reduce((sum, m) => sum + m.tempo_medio_primeira_resposta_segundos, 0) / metricas.length
      : 0;

    const satisfacaoMedia = metricas?.length
      ? metricas.reduce((sum, m) => sum + m.nota_media, 0) / metricas.length
      : 0;

    return NextResponse.json({
      total_conversas: totalConversas || 0,
      total_prospects: totalProspects || 0,
      matriculas_mes: matriculasMes || 0,
      receita_mes: receitaMes,
      taxa_conversao: Number(taxaConversao.toFixed(2)),
      taxa_automacao: Number(taxaAutomacao.toFixed(2)),
      tempo_medio_resposta: Math.round(tempoMedioResposta),
      satisfacao_media: Number(satisfacaoMedia.toFixed(2))
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
  }
}
```

#### 2.7 - Atualizar Dashboard Principal

**Arquivo:** `src/app/dashboard/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useFaculdade } from '@/contexts/FaculdadeContext';
import { StatsCard } from '@/components/ui/StatsCard';
import { Card } from '@/components/ui';
import { 
  MessageSquare, 
  Users, 
  GraduationCap, 
  DollarSign,
  TrendingUp,
  Bot,
  Clock,
  Star
} from 'lucide-react';

interface DashboardStats {
  total_conversas: number;
  total_prospects: number;
  matriculas_mes: number;
  receita_mes: number;
  taxa_conversao: number;
  taxa_automacao: number;
  tempo_medio_resposta: number;
  satisfacao_media: number;
}

export default function DashboardPage() {
  const { faculdadeSelecionada, loading: loadingFaculdade } = useFaculdade();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (faculdadeSelecionada) {
      carregarEstatisticas();
    }
  }, [faculdadeSelecionada]);

  async function carregarEstatisticas() {
    if (!faculdadeSelecionada) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/stats?faculdade_id=${faculdadeSelecionada.id}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loadingFaculdade || loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do atendimento WhatsApp</p>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Conversas"
          value={stats.total_conversas.toString()}
          icon={MessageSquare}
          iconColor="blue"
          trend={{ value: 12.5, isPositive: true }}
          subtitle="vs mês anterior"
        />

        <StatsCard
          title="Prospects Ativos"
          value={stats.total_prospects.toString()}
          icon={Users}
          iconColor="green"
          trend={{ value: 8.3, isPositive: true }}
          subtitle="vs mês anterior"
        />

        <StatsCard
          title="Matrículas do Mês"
          value={stats.matriculas_mes.toString()}
          icon={GraduationCap}
          iconColor="purple"
          trend={{ value: 15.2, isPositive: true }}
          subtitle="vs mês anterior"
        />

        <StatsCard
          title="Receita do Mês"
          value={`R$ ${stats.receita_mes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          iconColor="yellow"
          trend={{ value: 23.1, isPositive: true }}
          subtitle="vs mês anterior"
        />
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Taxa de Conversão"
          value={`${stats.taxa_conversao}%`}
          icon={TrendingUp}
          iconColor="red"
          subtitle="Prospects → Matrículas"
        />

        <StatsCard
          title="Taxa de Automação"
          value={`${stats.taxa_automacao}%`}
          icon={Bot}
          iconColor="indigo"
          subtitle="Resolvido por IA"
        />

        <StatsCard
          title="Tempo Médio Resposta"
          value={`${stats.tempo_medio_resposta}s`}
          icon={Clock}
          iconColor="orange"
          subtitle="Primeira resposta"
        />

        <StatsCard
          title="Satisfação Média"
          value={`${stats.satisfacao_media}/5`}
          icon={Star}
          iconColor="pink"
          subtitle="Avaliação dos clientes"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Horários de Pico" subtitle="Volume de mensagens por hora">
          <div className="h-64 flex items-center justify-center text-gray-400">
            Gráfico será implementado
          </div>
        </Card>

        <Card title="Setores Mais Acionados" subtitle="Distribuição por departamento">
          <div className="h-64 flex items-center justify-center text-gray-400">
            Gráfico será implementado
          </div>
        </Card>
      </div>
    </div>
  );
}
```

#### 2.8 - Atualizar Página de Prospects

**Arquivo:** `src/app/dashboard/prospects/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useFaculdade } from '@/contexts/FaculdadeContext';
import { supabase } from '@/lib/supabase';
import { ProspectAcademico } from '@/types/supabase';
import { StatsCard, Card, Badge, Input, Button } from '@/components/ui';
import { Users, TrendingUp, DollarSign, Star, Search, Download } from 'lucide-react';

export default function ProspectsPage() {
  const { faculdadeSelecionada } = useFaculdade();
  const [prospects, setProspects] = useState<ProspectAcademico[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (faculdadeSelecionada) {
      carregarProspects();
    }
  }, [faculdadeSelecionada]);

  async function carregarProspects() {
    if (!faculdadeSelecionada) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prospects_academicos')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProspects(data || []);
    } catch (error) {
      console.error('Erro ao carregar prospects:', error);
    } finally {
      setLoading(false);
    }
  }

  const prospectsFiltrados = prospects.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.telefone.includes(busca) ||
    p.email?.toLowerCase().includes(busca.toLowerCase()) ||
    p.curso.toLowerCase().includes(busca.toLowerCase())
  );

  const totalProspects = prospects.length;
  const taxaConversao = prospects.length > 0
    ? (prospects.filter(p => p.status_academico === 'matriculado').length / prospects.length) * 100
    : 0;
  const valorEstimado = prospects
    .filter(p => p.status_academico === 'qualificado' || p.status_academico === 'contatado')
    .reduce((sum, p) => sum + (p.valor_mensalidade || 0), 0);
  const notaMedia = prospects.length > 0
    ? prospects.reduce((sum, p) => sum + p.nota_qualificacao, 0) / prospects.length
    : 0;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      novo: 'info',
      contatado: 'warning',
      qualificado: 'warning',
      matriculado: 'success',
      perdido: 'danger'
    };
    return variants[status] || 'info';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      novo: 'Novo',
      contatado: 'Contatado',
      qualificado: 'Qualificado',
      matriculado: 'Matriculado',
      perdido: 'Perdido'
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Prospects</h1>
        <p className="text-gray-600 mt-1">Gerencie seus prospects e potenciais alunos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Prospects"
          value={totalProspects.toString()}
          icon={Users}
          iconColor="blue"
        />
        <StatsCard
          title="Taxa de Conversão"
          value={`${taxaConversao.toFixed(1)}%`}
          icon={TrendingUp}
          iconColor="green"
        />
        <StatsCard
          title="Valor Estimado"
          value={`R$ ${valorEstimado.toLocaleString('pt-BR')}`}
          icon={DollarSign}
          iconColor="yellow"
        />
        <StatsCard
          title="Nota Média"
          value={notaMedia.toFixed(1)}
          icon={Star}
          iconColor="purple"
        />
      </div>

      {/* Filtros e Ações */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar prospects..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </Card>

      {/* Tabela */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Contato</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Curso</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nota</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Valor</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Último Contato</th>
              </tr>
            </thead>
            <tbody>
              {prospectsFiltrados.map((prospect) => (
                <tr key={prospect.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{prospect.nome}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">{prospect.telefone}</div>
                    {prospect.email && (
                      <div className="text-xs text-gray-500">{prospect.email}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-700">{prospect.curso}</td>
                  <td className="py-3 px-4">
                    <Badge variant={getStatusBadge(prospect.status_academico)}>
                      {getStatusLabel(prospect.status_academico)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-700">{prospect.nota_qualificacao}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {prospect.valor_mensalidade 
                      ? `R$ ${prospect.valor_mensalidade.toLocaleString('pt-BR')}` 
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(prospect.ultimo_contato).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {prospectsFiltrados.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhum prospect encontrado
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
```

---

### FASE 3: Implementar Páginas Restantes

#### 3.1 - Atualizar Página de Conversas

**Arquivo:** `src/app/dashboard/conversas/page.tsx`

Similar ao prospects, adicionar:
- Filtro por `faculdade_id`
- Busca por nome/telefone
- Filtro por status e departamento
- Visualização de últimas mensagens
- Badge de mensagens não lidas

#### 3.2 - Atualizar Página de Analytics

**Arquivo:** `src/app/dashboard/analytics/page.tsx`

- Filtrar métricas por `faculdade_id`
- Gráficos com dados reais de `metricas_diarias`
- Comparações mês a mês
- Filtros de período

#### 3.3 - Criar Página de Gerenciamento de Faculdades

**Arquivo:** `src/app/dashboard/faculdades/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Faculdade } from '@/types/supabase';
import { Card, Badge, Button } from '@/components/ui';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';

export default function FaculdadesPage() {
  const [faculdades, setFaculdades] = useState<Faculdade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarFaculdades();
  }, []);

  async function carregarFaculdades() {
    try {
      const { data, error } = await supabase
        .from('faculdades')
        .select('*')
        .order('nome');

      if (error) throw error;
      setFaculdades(data || []);
    } catch (error) {
      console.error('Erro ao carregar faculdades:', error);
    } finally {
      setLoading(false);
    }
  }

  const getPlanoBadge = (plano: string) => {
    const variants: Record<string, 'success' | 'warning' | 'info'> = {
      basico: 'info',
      pro: 'warning',
      enterprise: 'success'
    };
    return variants[plano] || 'info';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      ativo: 'success',
      inativo: 'warning',
      suspenso: 'danger'
    };
    return variants[status] || 'info';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Faculdades</h1>
          <p className="text-gray-600 mt-1">Gerencie seus clientes</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Faculdade
        </Button>
      </div>

      {/* Grid de Faculdades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculdades.map((faculdade) => (
          <Card key={faculdade.id}>
            <div className="space-y-4">
              {/* Header do Card */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{faculdade.nome}</h3>
                    <p className="text-sm text-gray-500">{faculdade.cnpj}</p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Plano:</span>
                  <Badge variant={getPlanoBadge(faculdade.plano)}>
                    {faculdade.plano}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={getStatusBadge(faculdade.status)}>
                    {faculdade.status}
                  </Badge>
                </div>
                {faculdade.telefone && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Telefone:</span>
                    <span className="text-gray-900">{faculdade.telefone}</span>
                  </div>
                )}
                {faculdade.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-900 truncate ml-2">{faculdade.email}</span>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Button variant="secondary" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button variant="danger" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {faculdades.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma faculdade cadastrada
            </h3>
            <p className="text-gray-600 mb-6">
              Comece adicionando sua primeira faculdade cliente
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Faculdade
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
```

---

### FASE 4: Atualizar Navegação

#### 4.1 - Adicionar Link de Faculdades no Sidebar

**Arquivo:** `src/components/dashboard/Sidebar.tsx`

Adicionar item de menu:
```typescript
{
  name: 'Faculdades',
  href: '/dashboard/faculdades',
  icon: Building2
}
```

---

## 🚀 CHECKLIST DE EXECUÇÃO

### Banco de Dados
- [ ] Executar migration `002_create_tables_pt.sql` no Supabase
- [ ] Executar seed `seed.sql` para popular dados de exemplo
- [ ] Verificar se RLS está habilitado
- [ ] Testar queries manualmente

### Código
- [ ] Atualizar types em `src/types/supabase.ts`
- [ ] Criar `FaculdadeContext.tsx`
- [ ] Atualizar `dashboard/layout.tsx` com Provider
- [ ] Criar `FaculdadeSelector.tsx`
- [ ] Atualizar `Header.tsx`
- [ ] Atualizar API `/api/dashboard/stats/route.ts`
- [ ] Atualizar `dashboard/page.tsx`
- [ ] Atualizar `dashboard/prospects/page.tsx`
- [ ] Atualizar `dashboard/conversas/page.tsx`
- [ ] Atualizar `dashboard/analytics/page.tsx`
- [ ] Criar `dashboard/faculdades/page.tsx`
- [ ] Atualizar `Sidebar.tsx`

### Testes
- [ ] Verificar se seletor de faculdade funciona
- [ ] Verificar se dados são filtrados corretamente
- [ ] Testar todas as páginas
- [ ] Verificar responsividade
- [ ] Testar navegação

### Melhorias Futuras
- [ ] Implementar gráficos nos cards vazios
- [ ] Adicionar autenticação real
- [ ] Criar formulários de cadastro/edição
- [ ] Implementar exportação de relatórios
- [ ] Adicionar notificações em tempo real
- [ ] Criar sistema de permissões por usuário

---

## 📝 NOTAS IMPORTANTES

1. **Variáveis de Ambiente**: Certifique-se que `.env.local` tem:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
   ```

2. **RLS**: As políticas RLS estão simplificadas. Em produção, implementar autenticação adequada.

3. **Performance**: Para muitos dados, considerar paginação e lazy loading.

4. **Tipos**: TypeScript vai ajudar a pegar erros. Sempre verificar tipos ao integrar.

---

## ✅ RESULTADO ESPERADO

Após executar todas as tarefas:

1. ✅ Dashboard funcionando com dados reais
2. ✅ Sistema multi-tenant com seletor de faculdade
3. ✅ Todas as páginas exibindo dados filtrados
4. ✅ Métricas e KPIs calculados corretamente
5. ✅ Interface completa e responsiva
6. ✅ Dados de exemplo populados

---

**Pronto para desenvolvimento! 🚀**