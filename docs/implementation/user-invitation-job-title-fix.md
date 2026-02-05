# Correção: Convite de Usuários com Job Title

**Data:** 2026-01-08
**Status:** ✅ Implementado

---

## 📋 Problema Identificado

Ao convidar novos usuários, o sistema **não solicitava nem armazenava o cargo (job_title_id)**, resultando em:
- ❌ Usuários criados sem cargo definido
- ❌ Impossível criar avaliações de senioridade (requer job_title_id)
- ❌ Não cumpria o PRD Seção 2.2: "Todo usuário é criado com job_title_id definido e seniority_level=null"

---

## ✅ Solução Implementada

### 1. Migration: Adicionar `job_title_id` em `workspace_invitations`

**Arquivo:** `supabase/migrations/20260108000002_add_job_title_to_invitations.sql`

```sql
ALTER TABLE workspace_invitations
ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES job_titles(id) ON DELETE SET NULL;

ALTER TABLE workspace_invitations
ADD COLUMN IF NOT EXISTS squad_id UUID REFERENCES squads(id) ON DELETE SET NULL;
```

**Ação necessária:** Aplicar migration manualmente no Supabase

### 2. InviteUserForm: Adicionar seletor de cargo

**Arquivo:** `components/teams/invite-user-form.tsx`

**Mudanças:**
- ✅ Adicionado campo "Cargo *" (obrigatório)
- ✅ Select ordenado por hierarchy_level
- ✅ Ícone Briefcase
- ✅ Validação: não permite enviar sem cargo
- ✅ Alert se não houver cargos cadastrados
- ✅ Renomeado "Função / Cargo" para "Nível de Permissão" (para clareza)

**UI Atualizada:**
```
Email * → Nome (opcional) → Cargo * → Nível de Permissão
```

### 3. createInvitation: Salvar job_title_id

**Arquivo:** `app/actions/invitations.ts`

**Mudanças:**
- ✅ Novo parâmetro `jobTitleId` (obrigatório)
- ✅ Validação: retorna erro se job_title_id não for fornecido
- ✅ Salva job_title_id em `workspace_invitations`
- ✅ Envia job_title_id no email de convite (metadata)

### 4. ensureSupabaseUser: Usar job_title_id ao criar member

**Arquivo:** `lib/supabase/user.ts`

**Mudanças:**
- ✅ Busca `job_title_id` e `squad_id` do convite
- ✅ Cria `workspace_member` com:
  - `job_title_id` do convite
  - `squad_id` do convite (se houver)
  - **`seniority_level: null`** (conforme PRD 2.2)

**Código crítico:**
```typescript
const { error: memberError } = await supabase
  .from("workspace_members")
  .insert({
    workspace_id: invite.workspace_id,
    user_id: userId,
    access_level: accessLevel,
    role: invite.role === "owner" || invite.role === "admin" ? null : invite.role || null,
    job_title_id: invite.job_title_id || null, // ← NOVO
    squad_id: invite.squad_id || null, // ← NOVO
    seniority_level: null, // ← Sempre null inicialmente (PRD)
  })
```

### 5. Settings Page: Buscar e passar job_titles

**Arquivo:** `app/(dashboard)/[workspaceId]/settings/page.tsx`

**Mudanças:**
- ✅ Busca job_titles (workspace + global)
- ✅ Passa `jobTitles` para `UsersSettings`

### 6. Componentes: Propagar jobTitles

**Arquivos atualizados:**
- `components/settings/users-settings.tsx` → recebe e passa `jobTitles`
- `components/teams/invite-user-dialog.tsx` → recebe e passa `jobTitles`

---

## 🎯 Fluxo Completo Após Correção

### Convidar Usuário

```
1. Admin clica "Convidar Colaborador"
2. Preenche:
   - Email *
   - Nome (opcional)
   - Cargo * (ex: SDR, Closer, Gerente)
   - Nível de Permissão (ex: member, admin)
3. Sistema valida que cargo foi selecionado
4. Cria convite com job_title_id
5. Envia email com link de convite
```

### Usuário Aceita Convite

```
1. Usuário clica no link do email
2. Faz cadastro/login
3. ensureSupabaseUser() é executado:
   - Cria registro em `users`
   - Busca convite pendente
   - Cria `workspace_member` com:
     ✅ job_title_id (do convite)
     ✅ squad_id (se houver)
     ✅ seniority_level = null
   - Marca convite como "accepted"
4. Usuário é redirecionado para o workspace
```

### Criar Avaliação de Senioridade

```
1. Líder acessa "Senioridade" na sidebar
2. Clica "Nova Avaliação"
3. Seleciona usuário
4. Sistema busca job_title do usuário ✅
5. Filtra frameworks compatíveis com o cargo ✅
6. Cria avaliação normalmente
```

---

## ⚠️ Importante: Aplicar Migration

Antes de testar, você **DEVE** aplicar a migration manualmente:

### Via Supabase Dashboard:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo de `supabase/migrations/20260108000002_add_job_title_to_invitations.sql`
5. Execute

### Via Supabase CLI:

```bash
supabase db push
```

---

## ✅ Checklist de Testes

Após aplicar a migration, testar:

- [ ] Ir em Settings → Usuários
- [ ] Clicar "Convidar Colaborador"
- [ ] Verificar que campo "Cargo" aparece
- [ ] Verificar que lista de cargos está populada
- [ ] Tentar enviar sem selecionar cargo (deve dar erro)
- [ ] Enviar convite completo (com cargo)
- [ ] Aceitar convite em outra aba/navegador
- [ ] Verificar que usuário foi criado com job_title_id preenchido
- [ ] Verificar que seniority_level está NULL
- [ ] Tentar criar avaliação de senioridade para o novo usuário
- [ ] Verificar que framework é filtrado pelo cargo

---

## 📊 Impacto

### Antes:
- ❌ Usuários sem cargo
- ❌ Impossível criar avaliações
- ❌ Dados incompletos

### Depois:
- ✅ Todos os usuários têm cargo definido
- ✅ Avaliações de senioridade funcionam
- ✅ Conformidade com PRD
- ✅ seniority_level = null até primeira avaliação

---

## 🔜 Próximos Passos

Agora você pode:

1. **Aplicar a migration**
2. **Testar criação de usuários**
3. **Criar competency frameworks** (se ainda não existirem)
4. **Testar avaliações de senioridade** com usuários reais
5. **Continuar implementação do PRD**

---

**Status:** ✅ Pronto para testes após aplicar migration
