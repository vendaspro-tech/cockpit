'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth-server'

export async function uploadEvidence(
  pdiItemId: string,
  file: File,
  description?: string
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { error: 'Não autenticado' }
    }

    const adminSupabase = createAdminClient()

    // Upload file to Supabase Storage using Admin Client
    const fileExt = file.name.split('.').pop()
    const fileName = `${pdiItemId}/${Date.now()}.${fileExt}`
    
    const { data: _uploadData, error: uploadError } = await adminSupabase.storage
      .from('pdi-evidence')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: 'Erro ao fazer upload do arquivo' }
    }

    // Get public URL
    const { data: { publicUrl } } = adminSupabase.storage
      .from('pdi-evidence')
      .getPublicUrl(fileName)

    // Get internal user ID
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('id')
      .eq('supabase_user_id', user.id)
      .single()

    if (!dbUser) {
      // Try to delete uploaded file
      await adminSupabase.storage.from('pdi-evidence').remove([fileName])
      return { error: 'Usuário não encontrado no banco de dados' }
    }

    // Save evidence record to database
    const { data: evidence, error: dbError } = await adminSupabase
      .from('pdi_evidence')
      .insert({
        pdi_item_id: pdiItemId,
        file_url: publicUrl,
        description: description || null,
        uploaded_by: dbUser.id
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to delete uploaded file
      await adminSupabase.storage.from('pdi-evidence').remove([fileName])
      return { error: 'Erro ao salvar evidência no banco de dados' }
    }

    return { data: evidence }
  } catch (error) {
    console.error('Upload evidence error:', error)
    return { error: 'Erro inesperado ao fazer upload' }
  }
}

export async function deleteEvidence(evidenceId: string, _pdiItemId: string) {
  try {
    const supabase = createAdminClient()
    
    // Get evidence to find file path
    const { data: evidence } = await supabase
      .from('pdi_evidence')
      .select('file_url')
      .eq('id', evidenceId)
      .single()

    if (!evidence) {
      return { error: 'Evidência não encontrada' }
    }

    // Extract file path from URL
    const url = new URL(evidence.file_url)
    const filePath = url.pathname.split('/pdi-evidence/')[1]

    // Delete from storage using Admin Client
    if (filePath) {
      await supabase.storage
        .from('pdi-evidence')
        .remove([filePath])
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('pdi_evidence')
      .delete()
      .eq('id', evidenceId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return { error: 'Erro ao deletar evidência' }
    }

    return { data: { success: true } }
  } catch (error) {
    console.error('Delete evidence error:', error)
    return { error: 'Erro inesperado ao deletar evidência' }
  }
}

export async function getEvidences(pdiItemId: string) {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('pdi_evidence')
      .select(`
        *,
        uploader:uploaded_by(full_name, email)
      `)
      .eq('pdi_item_id', pdiItemId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Get evidences error:', error)
      return { error: 'Erro ao buscar evidências' }
    }

    return { data }
  } catch (error) {
    console.error('Get evidences error:', error)
    return { error: 'Erro inesperado ao buscar evidências' }
  }
}
