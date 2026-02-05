'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const ALLOWED_ACCESS_LEVELS = ['owner', 'admin']

async function getAuthorizedContext(workspaceId: string) {
  const authClient = await createClient()
  const { data: authUser, error: authError } = await authClient.auth.getUser()

  if (authError || !authUser.user) {
    throw new Error('Usuário não autenticado')
  }

  const admin = createAdminClient()
  const supabaseUserId = authUser.user.id

  const { data: dbUser, error: dbUserError } = await admin
    .from('users')
    .select('id')
    .eq('supabase_user_id', supabaseUserId)
    .maybeSingle()

  if (dbUserError) {
    console.error('Erro ao buscar usuário interno:', dbUserError)
    throw new Error('Erro ao localizar usuário')
  }

  if (!dbUser?.id) {
    throw new Error('Usuário não encontrado')
  }

  const { data: membership, error: membershipError } = await admin
    .from('workspace_members')
    .select('access_level, role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', dbUser.id)
    .maybeSingle()

  if (membershipError) {
    console.error('Erro ao validar permissão no workspace:', membershipError)
    throw new Error('Erro ao validar permissão')
  }

  const accessLevel = membership?.access_level || membership?.role
  if (!accessLevel || !ALLOWED_ACCESS_LEVELS.includes(accessLevel)) {
    throw new Error('Sem permissão para atualizar este produto')
  }

  return { admin, userId: dbUser.id }
}

async function ensureProductInWorkspace(
  admin: ReturnType<typeof createAdminClient>,
  productId: string,
  workspaceId: string
) {
  const { data: product, error } = await admin
    .from('products')
    .select('workspace_id')
    .eq('id', productId)
    .maybeSingle()

  if (error) {
    console.error('Erro ao validar workspace do produto:', error)
    throw new Error('Erro ao validar produto')
  }

  if (!product || product.workspace_id !== workspaceId) {
    throw new Error('Produto não pertence a este workspace')
  }
}

// Benefits
export async function createBenefit(productId: string, formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const workspaceId = formData.get('workspaceId') as string

  if (!title) throw new Error('Title is required')

  const { admin, userId } = await getAuthorizedContext(workspaceId)
  await ensureProductInWorkspace(admin, productId, workspaceId)

  const { error } = await admin
    .from('product_benefits')
    .insert({ product_id: productId, title, description, created_by: userId })

  if (error) {
    console.error('Erro ao criar benefício:', error)
    throw new Error(error.message || 'Failed to create benefit')
  }
  revalidatePath(`/${workspaceId}/products/${productId}`)
}

export async function deleteBenefit(id: string, productId: string, workspaceId: string) {
  const { admin } = await getAuthorizedContext(workspaceId)
  await ensureProductInWorkspace(admin, productId, workspaceId)

  const { error } = await admin.from('product_benefits').delete().eq('id', id)
  if (error) {
    console.error('Erro ao deletar benefício:', error)
    throw new Error(error.message || 'Failed to delete benefit')
  }
  revalidatePath(`/${workspaceId}/products/${productId}`)
}

export async function updateBenefit(
  productId: string,
  workspaceId: string,
  benefitId: string,
  payload: { title: string; description: string | null }
) {
  if (!payload.title) throw new Error('Title is required')

  const { admin } = await getAuthorizedContext(workspaceId)
  await ensureProductInWorkspace(admin, productId, workspaceId)

  const { error } = await admin
    .from('product_benefits')
    .update({
      title: payload.title,
      description: payload.description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', benefitId)

  if (error) {
    console.error('Erro ao atualizar benefício:', error)
    throw new Error(error.message || 'Failed to update benefit')
  }
  revalidatePath(`/${workspaceId}/products/${productId}`)
}

// Offers
export async function createOffer(productId: string, formData: FormData) {
  const name = formData.get('name') as string
  const price = formData.get('price') ? parseFloat(formData.get('price') as string) : null
  const description = formData.get('description') as string
  const workspaceId = formData.get('workspaceId') as string

  if (!name) throw new Error('Name is required')

  const { admin, userId } = await getAuthorizedContext(workspaceId)
  await ensureProductInWorkspace(admin, productId, workspaceId)

  const { error } = await admin
    .from('product_offers')
    .insert({ product_id: productId, name, price, description, created_by: userId })

  if (error) {
    console.error('Erro ao criar oferta:', error)
    throw new Error(error.message || 'Failed to create offer')
  }
  revalidatePath(`/${workspaceId}/products/${productId}`)
}

export async function deleteOffer(id: string, productId: string, workspaceId: string) {
  const { admin } = await getAuthorizedContext(workspaceId)
  await ensureProductInWorkspace(admin, productId, workspaceId)

  const { error } = await admin.from('product_offers').delete().eq('id', id)
  if (error) {
    console.error('Erro ao deletar oferta:', error)
    throw new Error(error.message || 'Failed to delete offer')
  }
  revalidatePath(`/${workspaceId}/products/${productId}`)
}

export async function updateOffer(
  productId: string,
  workspaceId: string,
  offerId: string,
  payload: { name: string; price: number | null; description: string | null }
) {
  if (!payload.name) throw new Error('Name is required')

  const { admin } = await getAuthorizedContext(workspaceId)
  await ensureProductInWorkspace(admin, productId, workspaceId)

  const { error } = await admin
    .from('product_offers')
    .update({
      name: payload.name,
      price: payload.price,
      description: payload.description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', offerId)

  if (error) {
    console.error('Erro ao atualizar oferta:', error)
    throw new Error(error.message || 'Failed to update offer')
  }
  revalidatePath(`/${workspaceId}/products/${productId}`)
}

// Objections
export async function createObjection(productId: string, formData: FormData) {
  const objection = formData.get('objection') as string
  const response = formData.get('response') as string
  const workspaceId = formData.get('workspaceId') as string

  if (!objection) throw new Error('Objection is required')

  const { admin, userId } = await getAuthorizedContext(workspaceId)
  await ensureProductInWorkspace(admin, productId, workspaceId)

  const { error } = await admin
    .from('product_objections')
    .insert({ product_id: productId, objection, response, created_by: userId })

  if (error) {
    console.error('Erro ao criar objeção:', error)
    throw new Error(error.message || 'Failed to create objection')
  }
  revalidatePath(`/${workspaceId}/products/${productId}`)
}

export async function deleteObjection(id: string, productId: string, workspaceId: string) {
  const { admin } = await getAuthorizedContext(workspaceId)
  await ensureProductInWorkspace(admin, productId, workspaceId)

  const { error } = await admin.from('product_objections').delete().eq('id', id)
  if (error) {
    console.error('Erro ao deletar objeção:', error)
    throw new Error(error.message || 'Failed to delete objection')
  }
  revalidatePath(`/${workspaceId}/products/${productId}`)
}

export async function updateObjection(
  productId: string,
  workspaceId: string,
  objectionId: string,
  payload: { objection: string; response: string | null }
) {
  if (!payload.objection) throw new Error('Objection is required')

  const { admin } = await getAuthorizedContext(workspaceId)
  await ensureProductInWorkspace(admin, productId, workspaceId)

  const { error } = await admin
    .from('product_objections')
    .update({
      objection: payload.objection,
      response: payload.response,
      updated_at: new Date().toISOString(),
    })
    .eq('id', objectionId)

  if (error) {
    console.error('Erro ao atualizar objeção:', error)
    throw new Error(error.message || 'Failed to update objection')
  }
  revalidatePath(`/${workspaceId}/products/${productId}`)
}

// Refusal Reasons
export async function createRefusalReason(productId: string, formData: FormData) {
  const reason = formData.get('reason') as string
  const workspaceId = formData.get('workspaceId') as string

  if (!reason) throw new Error('Reason is required')

  const { admin, userId } = await getAuthorizedContext(workspaceId)
  await ensureProductInWorkspace(admin, productId, workspaceId)

  const { error } = await admin
    .from('product_refusal_reasons')
    .insert({ product_id: productId, reason, created_by: userId })

  if (error) {
    console.error('Erro ao criar motivo de perda:', error)
    throw new Error(error.message || 'Failed to create refusal reason')
  }
  revalidatePath(`/${workspaceId}/products/${productId}`)
}

export async function updateRefusalReason(
  productId: string,
  workspaceId: string,
  reasonId: string,
  payload: { reason: string }
) {
  if (!payload.reason) throw new Error('Reason is required')

  const { admin } = await getAuthorizedContext(workspaceId)
  await ensureProductInWorkspace(admin, productId, workspaceId)

  const { error } = await admin
    .from('product_refusal_reasons')
    .update({
      reason: payload.reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reasonId)

  if (error) {
    console.error('Erro ao atualizar motivo de perda:', error)
    throw new Error(error.message || 'Failed to update refusal reason')
  }
  revalidatePath(`/${workspaceId}/products/${productId}`)
}

export async function deleteRefusalReason(id: string, productId: string, workspaceId: string) {
  const { admin } = await getAuthorizedContext(workspaceId)
  await ensureProductInWorkspace(admin, productId, workspaceId)

  const { error } = await admin.from('product_refusal_reasons').delete().eq('id', id)
  if (error) {
    console.error('Erro ao deletar motivo de perda:', error)
    throw new Error(error.message || 'Failed to delete refusal reason')
  }
  revalidatePath(`/${workspaceId}/products/${productId}`)
}
