-- ============================================
-- LIMPEZA DE DUPLICATAS - VERSÃO SIMPLES
-- ============================================
-- Funciona com UUID - Sem subqueries complexas
-- ============================================

-- PASSO 1: Verificar situação atual
-- ============================================
SELECT
  'PASSO 1: Situação Atual' as info,
  COUNT(*) as total_registros,
  COUNT(DISTINCT slug) as slugs_unicos,
  COUNT(*) - COUNT(DISTINCT slug) as duplicatas;
