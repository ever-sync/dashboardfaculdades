## Objetivo
Implementar o Dashboard WhatsApp Analytics com dados reais do Supabase, estrutura multi‑tenant e páginas completas, seguindo o roteiro definido em `script.md`.

## Escopo
- Padronizar e criar tabelas em português com multi‑tenant.
- Popular dados de exemplo (seed) para validação visual.
- Atualizar tipos, contexto, componentes e páginas para filtrar por `faculdade_id`.
- Ajustar API para agregação por cliente e período.
- Completar navegação e realizar testes de ponta a ponta.

## Fase 1: Banco de Dados
- Criar migrations para: `faculdades`, `conversas_whatsapp`, `mensagens`, `prospects_academicos`, `metricas_diarias`, `transferencias_setores`.
- Adicionar índices e RLS conforme `script.md`.
- Variáveis de ambiente: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Critérios de aceite:
  - Todas as tabelas criadas com índices e RLS.
  - Consultas básicas retornam resultados (SELECT, COUNT) sem erro.

## Fase 2: Seed
- Executar `seed.sql` com faculdades, conversas, mensagens, prospects e métricas dos últimos 30 dias.
- Critérios de aceite:
  - 3 faculdades criadas.
  - Conversas e prospects visíveis ao consultar por `faculdade_id`.
  - Métricas diárias populadas e únicas por (faculdade, data, departamento).

## Fase 3: Código da Aplicação
- Atualizar `src/types/supabase.ts` com tipos: `Faculdade`, `ConversaWhatsApp`, `Mensagem`, `ProspectAcademico`, `MetricaDiaria`, `TransferenciaSetor`.
- Criar contexto: `src/contexts/FaculdadeContext.tsx` com carregamento, seleção e estado.
- Envolver layout: `app/dashboard/layout.tsx` com `FaculdadeProvider`.
- Criar `FaculdadeSelector` e incluir no `Header`.
- Ajustar API: `app/api/dashboard/stats/route.ts` para aceitar `faculdade_id`, calcular KPIs e retornar agregados.
- Atualizar páginas:
  - `app/dashboard/page.tsx`: consumir API com `faculdade_id`, KPIs e ícones coloridos.
  - `app/dashboard/prospects/page.tsx`: listar `prospects_academicos` filtrando por cliente.
  - `app/dashboard/conversas/page.tsx`: listar `conversas_whatsapp` com filtros e busca.
  - `app/dashboard/analytics/page.tsx`: ler `metricas_diarias` e preparar gráficos reais.
  - `app/dashboard/relatorios/page.tsx`: manter conteúdo criado e integrar filtros.
- Critérios de aceite:
  - Cada página carrega dados do cliente selecionado.
  - KPIs exibem valores não‑zero com seed.

## Fase 4: Navegação
- Adicionar link de `Faculdades` ao `Sidebar`.
- Criar `app/dashboard/faculdades/page.tsx` com grid, badges e ações mock.
- Critérios de aceite:
  - Navegação para `Faculdades` ativa e lista clientes.

## Fase 5: Testes e Validação
- Testar seletor de faculdade (troca e recarregamento de páginas).
- Validar API com consultas por `faculdade_id` e período.
- Verificar responsividade, performance e ausência de erros no console.
- Rodar `eslint` e corrigir warnings críticos.
- Confirmar RLS não bloqueia leitura pública planejada.

## Riscos e Mitigações
- Divergência entre tabelas existentes e novas → alinhar API e tipos ao padrão português.
- RLS bloqueando leitura → ajustar políticas para SELECT público em desenvolvimento.
- Falta de dados → garantir execução de seed antes dos testes visuais.

## Cronograma (estimativo)
- Fase 1: 0.5 dia
- Fase 2: 0.5 dia
- Fase 3: 1.5 dias
- Fase 4: 0.5 dia
- Fase 5: 0.5 dia

## Entregáveis
- Migrations e seed aplicados no Supabase.
- Código atualizado com contexto de faculdades e páginas filtradas.
- API de KPIs por cliente com métricas agregadas.
- Navegação completa com página de faculdades.
- Checklist validado com evidências (prints ou logs).

## Próximo Passo
- Confirmar que devemos alinhar toda a aplicação ao padrão de tabelas em português (como no `script.md`). Após confirmação, inicio a execução fase a fase com validações em cada etapa.