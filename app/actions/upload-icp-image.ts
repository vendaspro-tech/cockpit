'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function uploadICPImage(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { error: 'Nenhum arquivo enviado' }
    }

    const supabase = createAdminClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('icp-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: 'Erro ao fazer upload da imagem' }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('icp-images')
      .getPublicUrl(fileName)

    return { url: publicUrl }
  } catch (error) {
    console.error('Unexpected upload error:', error)
    return { error: 'Erro inesperado ao fazer upload' }
  }
}
