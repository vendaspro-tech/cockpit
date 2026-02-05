# Supabase Migrations

Este projeto segue a convencao de nomes `YYYYMMDDHHMMSS_descricao.sql`.
Cada migration deve ter um timestamp unico para garantir ordem deterministica.

## Regras
- Nunca edite migrations ja aplicadas. Crie uma nova migration.
- Evite SQLs soltas fora de `supabase/migrations/`.
- Se precisar rodar manualmente, aplique em ordem alfabetica (timestamp).

## Arquivos legados
- `supabase/migrations/phase1_rag_setup.sql` e legacy e deve ser aplicado manualmente.

## Ajustes de timestamp (duplicados corrigidos)
- `20250101000001_comercial_pro.sql` -> `20250101000055_comercial_pro.sql`
- `20250101000012_add_pdi_id_to_assessments.sql` -> `20250101000056_add_pdi_id_to_assessments.sql`
- `20250101000015_add_super_admin.sql` -> `20250101000057_add_super_admin.sql`
- `20250101000031_add_def_justifications.sql` -> `20250101000058_add_def_justifications.sql`
- `20250101000032_enhance_products.sql` -> `20250101000059_enhance_products.sql`
