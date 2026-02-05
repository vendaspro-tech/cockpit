'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type KPICategory = 
  | 'Funil Venda Direta' 
  | 'Funil Sessão Estratégica' 
  | 'Marketing' 
  | 'Financeiro'

export interface KPI {
  id: string
  name: string
  description: string
  category: KPICategory
  benchmark: string
  formula: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Get all active KPIs, ordered by category and display order
 */
export async function getKPIs(): Promise<KPI[]> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('kpis')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('display_order', { ascending: true })
  
  if (error) {
    console.error('Error fetching KPIs:', error)
    return []
  }
  
  return data || []
}

/**
 * Get all KPIs (including inactive) - Admin only
 */
export async function getAllKPIs(): Promise<KPI[]> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('kpis')
    .select('*')
    .order('category', { ascending: true })
    .order('display_order', { ascending: true })
  
  if (error) {
    console.error('Error fetching all KPIs:', error)
    return []
  }
  
  return data || []
}

/**
 * Create a new KPI - Admin only
 */
export async function createKPI(kpi: Omit<KPI, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('kpis')
    .insert({
      name: kpi.name,
      description: kpi.description,
      category: kpi.category,
      benchmark: kpi.benchmark,
      formula: kpi.formula,
      display_order: kpi.display_order,
      is_active: kpi.is_active
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating KPI:', error)
    return { data: null, error: error.message }
  }
  
  revalidatePath('/[workspaceId]/kpis')
  revalidatePath('/[workspaceId]/kpis/admin')
  
  return { data, error: null }
}

/**
 * Update an existing KPI - Admin only
 */
export async function updateKPI(id: string, updates: Partial<Omit<KPI, 'id' | 'created_at'>>) {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('kpis')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating KPI:', error)
    return { data: null, error: error.message }
  }
  
  revalidatePath('/[workspaceId]/kpis')
  revalidatePath('/[workspaceId]/kpis/admin')
  
  return { data, error: null }
}

/**
 * Soft delete a KPI - Admin only
 */
export async function deleteKPI(id: string) {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('kpis')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting KPI:', error)
    return { error: error.message }
  }
  
  revalidatePath('/[workspaceId]/kpis')
  revalidatePath('/[workspaceId]/kpis/admin')
  
  return { error: null }
}
