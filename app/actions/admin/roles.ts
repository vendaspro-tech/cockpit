'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAuthUser } from "@/lib/auth-server"

const RoleSchema = z.object({
  slug: z.string().min(1, "Slug é obrigatório").regex(/^[a-z0-9_]+$/, "Slug deve conter apenas letras minúsculas, números e underline"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  permissions: z.record(z.string(), z.boolean()).default({}),
  is_system_role: z.boolean().default(false)
})

export async function getRoles() {
  const user = await getAuthUser()
  if (!user) return []

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return []

  const supabase = createAdminClient()

  // Only return system roles (owner, admin, member)
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .in('slug', ['owner', 'admin', 'member'])
    .order('slug', { ascending: true })

  if (error) {
    console.error('Error fetching roles:', error)
    return []
  }

  return data
}

export async function createRole(data: z.infer<typeof RoleSchema>) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const validated = RoleSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Dados inválidos' }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('roles')
    .insert(validated.data)

  if (error) {
    console.error('Error creating role:', error)
    return { error: 'Erro ao criar cargo' }
  }

  revalidatePath(`/admin/roles`)
  return { success: true }
}

export async function updateRole(slug: string, data: Partial<z.infer<typeof RoleSchema>>) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  // Prevent updating slug for now as it's the PK and used in foreign keys
  const { slug: _newSlug, ...updateData } = data

  const { error } = await supabase
    .from('roles')
    .update(updateData)
    .eq('slug', slug)

  if (error) {
    console.error('Error updating role:', error)
    return { error: 'Erro ao atualizar cargo' }
  }

  revalidatePath(`/admin/roles`)
  return { success: true }
}

export async function deleteRole(slug: string) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  // Check if it's a system role
  const { data: role } = await supabase.from('roles').select('is_system_role').eq('slug', slug).single()
  if (role?.is_system_role) {
    return { error: 'Não é possível excluir cargos do sistema' }
  }

  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('slug', slug)

  if (error) {
    console.error('Error deleting role:', error)
    // Likely foreign key constraint violation
    if (error.code === '23503') {
      return { error: 'Este cargo está em uso e não pode ser excluído' }
    }
    return { error: 'Erro ao excluir cargo' }
  }

  revalidatePath(`/admin/roles`)
  return { success: true }
}
