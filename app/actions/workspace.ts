'use server'

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getUserRole } from "@/lib/auth-utils"
import { ensureSupabaseUser } from "@/lib/supabase/user"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const WorkspaceSettingsSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(3, "Slug deve ter no mínimo 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  currency: z.enum(['BRL', 'USD', 'EUR']),
  timezone: z.string().min(1, "Fuso horário é obrigatório")
})

export async function createWorkspace(name: string, _token?: string) {
  const supabaseServer = await createClient()
  const { data: authData } = await supabaseServer.auth.getUser()
  const authUserId = authData.user?.id
  const DEFAULT_PLAN = 'Closer PRO'

  if (!authUserId) {
    console.error("❌ createWorkspace: Supabase user not found")
    return { error: "Não autorizado. Faça login novamente." }
  }

  const supabase = createAdminClient()

  // 1. Ensure the user exists in Supabase (webhook can fail in preview/prod)
  const { userId: supabaseUserId, error: syncError } = await ensureSupabaseUser(authUserId)

  if (!supabaseUserId) {
    return { error: syncError || 'Não foi possível sincronizar seu usuário. Saia e entre novamente.' }
  }

  // 2. Create Workspace
  // Generate a simple slug from name
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000)

  const payload = {
    name,
    slug,
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    plan: DEFAULT_PLAN
  }

  // Tenta criar com plano padrão; se a constraint antiga ainda existir, faz fallback para "pro"
  let { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert(payload)
    .select()
    .single()

  if (workspaceError?.code === '23514') {
    // Constraint check failure (provavelmente plano não permitido). Tenta com "pro".
    console.warn('⚠️ createWorkspace: fallback to plan "pro" devido a constraint legacy.')
    const fallbackPayload = { ...payload, plan: 'pro' }
    const fallback = await supabase
      .from('workspaces')
      .insert(fallbackPayload)
      .select()
      .single()
    workspace = fallback.data
    workspaceError = fallback.error
  }

  if (workspaceError) {
    console.error('Error creating workspace:', workspaceError)
    return { error: 'Erro ao criar workspace' }
  }

  // 3. Add user as owner
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: supabaseUserId,
      access_level: 'owner',
      role: null
    })

  if (memberError) {
    console.error('Error adding owner:', memberError)
    // Cleanup workspace if member creation fails? 
    // For now, just return error, but ideally we should transaction this or cleanup.
    return { error: 'Erro ao definir permissões do workspace' }
  }

  return { success: true, workspaceId: workspace.id }
}

export async function updateWorkspace(workspaceId: string, formData: FormData) {
  const supabaseServer = await createClient()
  const { data: authData } = await supabaseServer.auth.getUser()
  const userId = authData.user?.id
  if (!userId) return { error: 'Não autorizado' }

  const role = await getUserRole(userId, workspaceId)
  const canUpdate = role === 'system_owner' || role === 'owner' || role === 'admin'
  
  if (!canUpdate) {
    return { error: 'Permissão insuficiente para atualizar configurações' }
  }

  const supabase = createAdminClient()

  const payload = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    currency: formData.get('currency'),
    timezone: formData.get('timezone')
  }

  const validatedFields = WorkspaceSettingsSchema.safeParse(payload)

  if (!validatedFields.success) {
    return { error: 'Dados inválidos. Verifique os campos.' }
  }

  const { error } = await supabase
    .from('workspaces')
    .update(validatedFields.data)
    .eq('id', workspaceId)

  if (error) {
    console.error('Error updating workspace:', error)
    if (error.code === '23505') { // Unique violation
      return { error: 'Este slug já está em uso.' }
    }
    return { error: 'Erro ao atualizar configurações' }
  }

  revalidatePath(`/${workspaceId}/settings`)
  return { success: true }
}

export async function uploadWorkspaceLogo(workspaceId: string, formData: FormData) {
  const supabaseServer = await createClient()
  const { data } = await supabaseServer.auth.getUser()
  const userId = data.user?.id
  if (!userId) return { error: 'Não autorizado' }

  const role = await getUserRole(userId, workspaceId)
  const canUpdate = role === 'system_owner' || role === 'owner' || role === 'admin'
  
  if (!canUpdate) {
    return { error: 'Permissão insuficiente para atualizar logo' }
  }

  const supabase = createAdminClient()
  const file = formData.get('file') as File

  if (!file) {
    return { error: 'Nenhum arquivo selecionado' }
  }

  if (file.size > 2 * 1024 * 1024) { // 2MB limit
    return { error: 'Arquivo muito grande (máx 2MB)' }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${workspaceId}-${Date.now()}.${fileExt}`
  const filePath = `logos/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('workspace-assets')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading logo:', uploadError)
    return { error: 'Erro ao fazer upload da logo' }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('workspace-assets')
    .getPublicUrl(filePath)

  // Update workspace with new logo URL
  const { error: updateError } = await supabase
    .from('workspaces')
    .update({ logo_url: publicUrl })
    .eq('id', workspaceId)

  if (updateError) {
    console.error('Error updating workspace logo:', updateError)
    return { error: 'Erro ao salvar URL da logo' }
  }

  revalidatePath(`/${workspaceId}/settings`)
  return { success: true, url: publicUrl }
}

export async function getWorkspaceDetails(workspaceId: string) {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()

  if (error) {
    console.error('Error fetching workspace:', error)
    return null
  }

  return data
}

export async function deleteWorkspace(workspaceId: string) {
  const supabaseServer = await createClient()
  const { data } = await supabaseServer.auth.getUser()
  const userId = data.user?.id
  if (!userId) return { error: 'Não autorizado' }

  const role = await getUserRole(userId, workspaceId)
  if (role !== 'system_owner') {
    return { error: 'Apenas o proprietário do sistema pode excluir o workspace' }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)

  if (error) {
    console.error('Error deleting workspace:', error)
    return { error: 'Erro ao excluir workspace' }
  }

  return { success: true }
}

export async function getUserWorkspaces() {
  const supabaseServer = await createClient()
  const { data } = await supabaseServer.auth.getUser()
  const authUserId = data.user?.id
  if (!authUserId) return []

  const supabase = createAdminClient()

  const { userId: supabaseUserId, error: userSyncError } = await ensureSupabaseUser(authUserId)

  if (!supabaseUserId) {
    console.error('Error ensuring Supabase user:', userSyncError)
    return []
  }

  // 2. Get workspace IDs where user is a member using internal ID
  const { data: memberships, error: memberError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', supabaseUserId)

  if (memberError || !memberships) {
    console.error('Error fetching memberships:', JSON.stringify(memberError, null, 2))
    return []
  }

  const workspaceIds = memberships.map(m => m.workspace_id)

  if (workspaceIds.length === 0) return []

  // 3. Fetch workspace details
  const { data: workspaces, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, name, logo_url')
    .in('id', workspaceIds)
    .order('name')

  if (workspaceError) {
    console.error('Error fetching workspaces:', JSON.stringify(workspaceError, null, 2))
    return []
  }

  return workspaces
}
