'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

interface ProductFormData {
  name: string
  description?: string
  standard_price?: string
  value_ladder_level?: string
  type?: string
  sales_page_url?: string
  checkout_url?: string
  benefits?: Array<{ title: string; description?: string }>
  offers?: Array<{ name: string; price?: string; description?: string }>
  objections?: Array<{ objection: string; response?: string }>
  refusal_reasons?: Array<{ reason: string }>
}

export interface WorkspaceProductSummary {
  id: string
  name: string
  squad_id: string | null
}

export async function getWorkspaceProducts(workspaceId: string): Promise<WorkspaceProductSummary[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .select('id, name, squad_id')
      .eq('workspace_id', workspaceId)
      .order('name')

    if (error) {
      console.error('Error fetching workspace products:', JSON.stringify(error, null, 2))
      return []
    }

    return (data as WorkspaceProductSummary[]) || []
  } catch (error) {
    console.error('Error in getWorkspaceProducts action:', error)
    return []
  }
}

// Get products with full details for commercial plans
export async function getProductsForCommercialPlan(workspaceId: string) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, standard_price')
      .eq('workspace_id', workspaceId)
      .order('name')

    if (error) {
      console.error('Error fetching products for commercial plan:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getProductsForCommercialPlan:', error)
    return []
  }
}

export async function updateSquadProducts(
  workspaceId: string,
  squadId: string,
  productIds: string[]
) {
  try {
    const supabase = createAdminClient()

    const { data: currentProducts, error: currentError } = await supabase
      .from('products')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('squad_id', squadId)

    if (currentError) {
      console.error('Error fetching squad products:', JSON.stringify(currentError, null, 2))
      return { error: 'Falha ao carregar produtos do squad.' }
    }

    const currentIds = new Set((currentProducts || []).map((p: { id: string }) => p.id))
    const uniqueIds = Array.from(new Set(productIds.filter(Boolean)))
    const selectedIds = new Set(uniqueIds)

    const toAssign = uniqueIds.filter((id) => !currentIds.has(id))
    const toRemove = Array.from(currentIds).filter((id) => !selectedIds.has(id))

    if (toAssign.length > 0) {
      const { error: assignError } = await supabase
        .from('products')
        .update({ squad_id: squadId, updated_at: new Date().toISOString() })
        .in('id', toAssign)
        .eq('workspace_id', workspaceId)

      if (assignError) {
        console.error('Error assigning products to squad:', JSON.stringify(assignError, null, 2))
        return { error: 'Falha ao vincular produtos ao squad.' }
      }
    }

    if (toRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('products')
        .update({ squad_id: null, updated_at: new Date().toISOString() })
        .in('id', toRemove)
        .eq('workspace_id', workspaceId)

      if (removeError) {
        console.error('Error removing products from squad:', JSON.stringify(removeError, null, 2))
        return { error: 'Falha ao remover produtos do squad.' }
      }
    }

    revalidatePath(`/${workspaceId}/products`)
    return { error: null }
  } catch (error) {
    console.error('Error in updateSquadProducts action:', error)
    return { error: 'Erro inesperado ao atualizar produtos.' }
  }
}

export async function createProductsForSquad(
  workspaceId: string,
  squadId: string,
  productNames: string[]
) {
  try {
    const supabase = createAdminClient()
    const normalizedNames = productNames
      .map((name) => name.trim())
      .filter((name) => name.length > 0)

    if (normalizedNames.length === 0) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('products')
      .insert(
        normalizedNames.map((name) => ({
          workspace_id: workspaceId,
          name,
          squad_id: squadId,
        }))
      )
      .select('id, name, squad_id')

    if (error) {
      console.error('Error creating squad products:', JSON.stringify(error, null, 2))
      return { data: [], error: 'Falha ao criar produtos.' }
    }

    revalidatePath(`/${workspaceId}/products`)
    return { data: (data as WorkspaceProductSummary[]) || [], error: null }
  } catch (error) {
    console.error('Error in createProductsForSquad action:', error)
    return { data: [], error: 'Erro inesperado ao criar produtos.' }
  }
}

export async function createProduct(workspaceId: string, data: ProductFormData) {
  try {
    const supabase = createAdminClient()

    // 1. Criar produto principal
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        workspace_id: workspaceId,
        name: data.name,
        description: data.description || null,
        standard_price: data.standard_price ? parseFloat(data.standard_price) : null,
        value_ladder_level: data.value_ladder_level || null,
        type: data.type || null,
        sales_page_url: data.sales_page_url || null,
        checkout_url: data.checkout_url || null
      })
      .select()
      .single()

    if (productError) {
      console.error('Error creating product:', JSON.stringify(productError, null, 2))
      throw new Error('Failed to create product')
    }

    // 2. Inserir benefícios
    if (data.benefits && data.benefits.length > 0) {
      const benefits = data.benefits.map((benefit, index) => ({
        product_id: product.id,
        title: benefit.title,
        description: benefit.description || null,
        order_index: index,
      }))

      const { error: benefitsError } = await supabase
        .from('product_benefits')
        .insert(benefits)

      if (benefitsError) {
        console.error('Error creating benefits:', JSON.stringify(benefitsError, null, 2))
      }
    }

    // 3. Inserir ofertas
    if (data.offers && data.offers.length > 0) {
      const offers = data.offers.map((offer, index) => ({
        product_id: product.id,
        name: offer.name,
        price: offer.price ? parseFloat(offer.price) : null,
        description: offer.description || null,
        order_index: index,
      }))

      const { error: offersError } = await supabase
        .from('product_offers')
        .insert(offers)

      if (offersError) {
        console.error('Error creating offers:', JSON.stringify(offersError, null, 2))
      }
    }

    // 4. Inserir objeções
    if (data.objections && data.objections.length > 0) {
      const objections = data.objections.map((objection, index) => ({
        product_id: product.id,
        objection: objection.objection,
        response: objection.response || null,
        order_index: index,
      }))

      const { error: objectionsError } = await supabase
        .from('product_objections')
        .insert(objections)

      if (objectionsError) {
        console.error('Error creating objections:', JSON.stringify(objectionsError, null, 2))
      }
    }

    // 5. Inserir motivos de recusa
    if (data.refusal_reasons && data.refusal_reasons.length > 0) {
      const refusalReasons = data.refusal_reasons.map((reason, index) => ({
        product_id: product.id,
        reason: reason.reason,
        order_index: index,
      }))

      const { error: refusalReasonsError } = await supabase
        .from('product_refusal_reasons')
        .insert(refusalReasons)

      if (refusalReasonsError) {
        console.error('Error creating refusal reasons:', JSON.stringify(refusalReasonsError, null, 2))
      }
    }

    revalidatePath(`/${workspaceId}/products`)
    return { success: true, productId: product.id }
  } catch (error) {
    console.error('Error in createProduct action:', error)
    throw error
  }
}

export async function deleteProduct(productId: string, workspaceId: string) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Error deleting product:', JSON.stringify(error, null, 2))
      throw new Error('Failed to delete product')
    }

    revalidatePath(`/${workspaceId}/products`)
    return { success: true }
  } catch (error) {
    console.error('Error in deleteProduct action:', error)
    throw error
  }
}

export async function updateProduct(productId: string, workspaceId: string, data: ProductFormData) {
  try {
    const supabase = createAdminClient()

    // 1. Atualizar produto principal
    const { error: productError } = await supabase
      .from('products')
      .update({
        name: data.name,
        description: data.description || null,
        standard_price: data.standard_price ? parseFloat(data.standard_price) : null,
        value_ladder_level: data.value_ladder_level || null,
        type: data.type || null,
        sales_page_url: data.sales_page_url || null,
        checkout_url: data.checkout_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)

    if (productError) {
      console.error('Error updating product:', JSON.stringify(productError, null, 2))
      throw new Error('Failed to update product')
    }

    // 2. Deletar relações antigas e inserir novas
    // Benefits
    await supabase.from('product_benefits').delete().eq('product_id', productId)
    if (data.benefits && data.benefits.length > 0) {
      const benefits = data.benefits.map((benefit, index) => ({
        product_id: productId,
        title: benefit.title,
        description: benefit.description || null,
        order_index: index,
      }))
      await supabase.from('product_benefits').insert(benefits)
    }

    // Offers
    await supabase.from('product_offers').delete().eq('product_id', productId)
    if (data.offers && data.offers.length > 0) {
      const offers = data.offers.map((offer, index) => ({
        product_id: productId,
        name: offer.name,
        price: offer.price ? parseFloat(offer.price) : null,
        description: offer.description || null,
        order_index: index,
      }))
      await supabase.from('product_offers').insert(offers)
    }

    // Objections
    await supabase.from('product_objections').delete().eq('product_id', productId)
    if (data.objections && data.objections.length > 0) {
      const objections = data.objections.map((objection, index) => ({
        product_id: productId,
        objection: objection.objection,
        response: objection.response || null,
        order_index: index,
      }))
      await supabase.from('product_objections').insert(objections)
    }

    // Refusal Reasons
    await supabase.from('product_refusal_reasons').delete().eq('product_id', productId)
    if (data.refusal_reasons && data.refusal_reasons.length > 0) {
      const refusalReasons = data.refusal_reasons.map((reason, index) => ({
        product_id: productId,
        reason: reason.reason,
        order_index: index,
      }))
      await supabase.from('product_refusal_reasons').insert(refusalReasons)
    }

    revalidatePath(`/${workspaceId}/products`)
    revalidatePath(`/${workspaceId}/products/${productId}`)
    return { success: true }
  } catch (error) {
    console.error('Error in updateProduct action:', error)
    throw error
  }
}

export async function saveSalesScript(
  workspaceId: string,
  productId: string,
  content: string,
  editorId: string,
  icpId: string | null,
  scriptName: string
) {
  try {
    const supabase = createAdminClient()

    if (!icpId) {
      throw new Error('ICP é obrigatório para scripts de venda')
    }
    const normalizedName = scriptName?.trim() || 'Script'

    // Map auth user -> internal user id
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_user_id', editorId)
      .single()

    // Get latest version
    const { data: latest } = await supabase
      .from('product_sales_scripts')
      .select('version')
      .eq('product_id', productId)
      .eq('name', normalizedName)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const newVersion = (latest?.version || 0) + 1

    const { error } = await supabase
      .from('product_sales_scripts')
      .insert({
        product_id: productId,
        content,
        version: newVersion,
        editor_id: editorId,
        created_by: dbUser?.id || null,
        icp_id: icpId,
        name: normalizedName,
      })

    if (error) {
      console.error('Error saving sales script:', JSON.stringify(error, null, 2))
      throw new Error('Failed to save sales script')
    }

    revalidatePath(`/${workspaceId}/products`)
    revalidatePath(`/${workspaceId}/products/${productId}`)
    return { success: true, version: newVersion }
  } catch (error) {
    console.error('Error in saveSalesScript action:', error)
    throw error
  }
}

export async function getSalesScripts(productId: string) {
  try {
    const supabase = createAdminClient()

    const baseQuery = supabase
      .from('product_sales_scripts')
      .select(`
        id,
        version,
        content,
        created_at,
        editor:editor_id(full_name, email),
        icp_id,
        created_by,
        name
      `)
      .eq('product_id', productId)
      .order('version', { ascending: false })

    const { data, error } = await baseQuery

    // Fallback em caso de erro por coluna ausente (ex.: migração ainda não aplicada)
    if (error) {
      console.error('Error fetching sales scripts (detailed columns):', JSON.stringify(error, null, 2))
      const fallback = await supabase
        .from('product_sales_scripts')
        .select(`
          id,
          version,
          content,
          created_at,
          editor:editor_id(full_name, email)
        `)
        .eq('product_id', productId)
        .order('version', { ascending: false })

      if (!fallback.error) {
        return (
          fallback.data?.map((row) => ({
            ...row,
            icp_id: null,
            created_by: null,
            name: 'Script Principal',
          })) || []
        )
      }

      // Se fallback também falhar, retorna vazio para não quebrar UI
      console.error('Fallback also failed:', JSON.stringify(fallback.error, null, 2))
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getSalesScripts action:', error)
    return []
  }
}
