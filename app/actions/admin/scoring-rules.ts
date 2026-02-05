'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { isSystemOwner } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { getAuthUser } from "@/lib/auth-server"

export interface TestStructure {
  id: string
  test_type: string
  structure: Record<string, unknown>
  version: string
  updated_at: string
}

export async function getTestStructures(): Promise<TestStructure[]> {
  const user = await getAuthUser()
  if (!user) return []

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return []

  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('test_structures')
    .select('*')
    .order('test_type', { ascending: true })

  if (error) {
    console.error('Error fetching test structures:', error)
    return []
  }

  return data
}

export async function updateTestStructure(id: string, structure: Record<string, unknown>) {
  const user = await getAuthUser()
  if (!user) return { error: 'Não autorizado' }

  const isOwner = await isSystemOwner(user.id)
  if (!isOwner) return { error: 'Não autorizado' }

  const supabase = createAdminClient()

  // Validate JSON? For now we assume the admin knows what they are doing or the UI validates it.
  // We should probably bump the version or just update updated_at.
  
  const { error } = await supabase
    .from('test_structures')
    .update({ 
      structure,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating test structure:', error)
    return { error: 'Erro ao atualizar estrutura' }
  }

  revalidatePath(`/admin/scoring-rules`)
  return { success: true }
}
