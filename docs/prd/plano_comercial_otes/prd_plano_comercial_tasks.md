# Plano Comercial - Backlog de tarefas

Fonte: PRD v2.1 (`docs/prd/prd_plano_comercial.md`) + analise da implementacao atual.

## 1. Base tecnica e dados
- [ ] Remover uso de `plan_marketing_config` no codigo e consolidar marketing em `plan_product_month_strategies` (monthly_investment, cpl, mql_to_sql_rate).
- [ ] Definir uso de `plan_squad_config`; se for manter, implementar CRUD e integracao no fluxo do plano.
- [ ] Implementar validacao de share total (produtos do plano = 100% e estrategias do mes = 100%).
- [ ] Garantir que campos de auditoria e status (approved_by, approved_at, internal_notes, mentor_feedback) sejam suportados nas actions.

## 2. Server actions e APIs
- [ ] Implementar actions dedicadas: setDaysMode e getPlanOverview.
- [ ] Implementar `getFinanceBreakdown`, `getTeamByRoleSeniority` e calculos agregados do plano.
- [ ] Implementar `calculatePlanResults`/`recalculateOnChange` para recalcular resultados apos mudancas.
- [ ] Implementar `getSquadKPIs` real (agregado de produtos e meses).
- [ ] Expor acao para redistribuir shares do mes (se a feature continuar no escopo).

## 3. Calculos e cache
- [ ] Aplicar `days_mode` e `business_days_config` na definicao de dias trabalhados.
- [ ] Calcular KPIs agregados por plano e por squad (MQLs, SQLs, vendas, revenue, investimento, CAC, ROAS, ROI, margem).
- [ ] Calcular payroll mensal/anual (OTE x headcount) e EBITDA.
- [ ] Popular tabelas de cache: `plan_product_strategy_results`, `plan_squad_month_summary`, `plan_annual_summary`.

## 4. UI - Overview e configuracoes do plano
- [ ] Substituir KPIs placeholder por dados reais.
- [ ] Grafico de revenue por mes (barras empilhadas) e tabela resumo por produto/squad.
- [ ] Editor de dias uteis/corridos com configuracao por mes.

## 5. UI - Produtos e estrategias
- [ ] Validar share total do plano ao adicionar/editar produto (avisos quando > 100%).
- [ ] Validar share do mes e destacar meses incompletos.
- [ ] (Opcional) UI para redistribuir shares do mes.
- [ ] Garantir estados vazios e mensagens de erro consistentes nos KPIs por produto.

## 6. UI - Squads
- [ ] Remover opcao de ativar/desativar squads (squads obrigatorios no plano).
- [ ] Configuracao de squad no plano (share, estrategia default, parametros) via `plan_squad_config`.
- [ ] KPIs por squad reais no modal.
- [ ] Agregacao por squad no overview e na tab Financas.

## 7. UI - OTEs e Time
- [ ] Conectar Team tab a `plan_team_structure` (CRUD) e calcular headcount por mes.
- [ ] Exibir ratios e distribuicao por senioridade (graficos/tabela).
- [ ] Integrar payroll por cargo/senioridade com OTEs configurados.

## 8. UI - Financas
- [ ] Tabela mensal com MQLs, SQLs, revenue, investimento, CAC, ROI, margem.
- [ ] EBITDA e margem de contribuicao considerando folha.
- [ ] Indicadores de marketing (ex: ROAS esperado).

## 9. Simulador e cenarios
- [ ] Rota `/[workspaceId]/commercial-plan/[planId]/simulator`.
- [ ] CRUD de cenarios (`plan_scenarios`), comparacao e ajuste de parametros.

## 10. Admin e workflow
- [ ] Rota `/admin/commercial-plans` (lista, filtros, estatisticas).
- [ ] Detalhe do plano no admin com modo view/edit e notas do mentor.
- [ ] Acoes: aprovar, solicitar revisao, calibrar valores, exportar relatorio.
- [ ] Historico de auditoria.

## 11. Exportacao e relatorios
- [ ] Exportacao para Excel/CSV do plano.
- [ ] Relatorios consolidados no admin.

## 12. Permissoes e regras
- [ ] Ajustar regras de acesso conforme PRD (ex: criar plano apenas nivel 0).
- [ ] Restringir transicoes de status por papel.
