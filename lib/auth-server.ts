import { createClient } from "@/lib/supabase/server"

export async function getAuthUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function requireAuthUser() {
  const user = await getAuthUser()
  if (!user) {
    throw new Error("Não autenticado")
  }
  return user
}
