'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface ICPFormData {
  name: string
  image_url?: string
  age_range?: string
  gender?: string
  location?: string
  profession?: string
  income_range?: string
  main_pain?: string
  main_goal?: string
  objections?: string[]
  life_context?: string
  urgency?: string
  product_ids?: string[]
}

export async function getICPs(workspaceId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('icps')
    .select(`
      *,
      icp_products (
        product_id
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching ICPs:', JSON.stringify(error, null, 2))
    return []
  }

  return data
}

export async function getICP(id: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('icps')
    .select(`
      *,
      icp_products (
        product_id
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching ICP:', error)
    return null
  }

  return data
}

export async function createICP(workspaceId: string, data: ICPFormData) {
  const supabase = createAdminClient()

  const { data: icp, error } = await supabase
    .from('icps')
    .insert({
      workspace_id: workspaceId,
      name: data.name,
      image_url: data.image_url,
      age_range: data.age_range,
      gender: data.gender,
      location: data.location,
      profession: data.profession,
      income_range: data.income_range,
      main_pain: data.main_pain,
      main_goal: data.main_goal,
      objections: data.objections,
      life_context: data.life_context,
      urgency: data.urgency,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating ICP:', error)
    throw new Error('Failed to create ICP')
  }

  if (data.product_ids && data.product_ids.length > 0) {
    const productInserts = data.product_ids.map(productId => ({
      icp_id: icp.id,
      product_id: productId
    }))

    const { error: productsError } = await supabase
      .from('icp_products')
      .insert(productInserts)

    if (productsError) {
      console.error('Error linking products to ICP:', productsError)
      // Non-fatal, but should be logged
    }
  }

  revalidatePath(`/${workspaceId}/products`)
  return icp
}

export async function updateICP(id: string, workspaceId: string, data: ICPFormData) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('icps')
    .update({
      name: data.name,
      image_url: data.image_url,
      age_range: data.age_range,
      gender: data.gender,
      location: data.location,
      profession: data.profession,
      income_range: data.income_range,
      main_pain: data.main_pain,
      main_goal: data.main_goal,
      objections: data.objections,
      life_context: data.life_context,
      urgency: data.urgency,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating ICP:', error)
    throw new Error('Failed to update ICP')
  }

  // Update products
  // First delete existing
  await supabase
    .from('icp_products')
    .delete()
    .eq('icp_id', id)

  // Then insert new
  if (data.product_ids && data.product_ids.length > 0) {
    const productInserts = data.product_ids.map(productId => ({
      icp_id: id,
      product_id: productId
    }))

    const { error: productsError } = await supabase
      .from('icp_products')
      .insert(productInserts)

    if (productsError) {
      console.error('Error linking products to ICP:', productsError)
    }
  }

  revalidatePath(`/${workspaceId}/products`)
  revalidatePath(`/${workspaceId}/products/icp/${id}`)
}

export async function deleteICP(id: string, workspaceId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('icps')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting ICP:', error)
    throw new Error('Failed to delete ICP')
  }

  revalidatePath(`/${workspaceId}/products`)
}
