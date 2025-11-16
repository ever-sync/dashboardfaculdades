## Visão Geral
- Documentar funcionalidades implementadas, páginas, componentes e integrações.
- Consolidar o esquema das tabelas em uso (migradas no projeto e referenciadas nas APIs).

## Alinhamento de Banco
- Comparar as tabelas do projeto (`conversations`, `messages`, `prospects`, `analytics_stats`) com as usadas na API (`conversas_whatsapp`, `prospects_academicos`, `metricas_diarias`).
- Propor um de dois caminhos:
  1. Criar migrações para `conversas_whatsapp`, `prospects_academicos`, `metricas_diarias` no repositório;
  2. Atualizar a API para usar as tabelas já migradas (`conversations`, `prospects`, `analytics_stats`).
- Validar consultas, índices e RLS/permissões.

## Entregáveis
- Documento técnico com:
  - Descrição das funcionalidades do sistema e mudanças realizadas.
  - Tabelas do banco com colunas, tipos, restrições e índices.
  - Variáveis de ambiente e fluxo de dados.
- Opcional: página `/dashboard/docs` com essa documentação renderizada.

## Próximos Passos
- Confirmar se prefere alinhar a API às tabelas já migradas ou criar novas migrações para as tabelas em português.
- Após confirmação, implementar o caminho escolhido e gerar o documento técnico/página.
