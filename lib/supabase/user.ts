import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function ensureSupabaseUser(authUserId?: string) {
  if (!authUserId) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    authUserId = data.user?.id
  }

  if (!authUserId) {
    return { error: "Não autorizado" }
  }

  const client = await createClient()
  const { data: authData } = await client.auth.getUser()
  const user = authData.user

  if (!user) {
    return { error: "Não autorizado" }
  }

  const email = user.email || user.user_metadata?.email || ""
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    [user.user_metadata?.first_name, user.user_metadata?.last_name]
      .filter(Boolean)
      .join(" ") ||
    null

  const supabase = createAdminClient()

  // 1) Tenta pelo supabase_user_id (novo fluxo)
  const { data: existingBySupabaseId, error: fetchError } = await supabase
    .from("users")
    .select("id")
    .eq("supabase_user_id", authUserId)
    .maybeSingle()

  if (fetchError) {
    console.error("Error fetching Supabase user:", fetchError)
  }

  if (existingBySupabaseId?.id) {
    return { userId: existingBySupabaseId.id }
  }

  // 2) Fallback: localizar pelo email (caso a migração tenha mantido o antigo clerk_user_id)
  if (email) {
    const { data: existingByEmail } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existingByEmail?.id) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ supabase_user_id: authUserId })
        .eq("id", existingByEmail.id)

      if (updateError) {
        console.error("Error updating supabase_user_id by email:", updateError)
      } else {
        return { userId: existingByEmail.id }
      }
    }
  }

  const { data: newUser, error: insertError } = await supabase
    .from("users")
    .upsert(
      {
        supabase_user_id: authUserId,
        email,
        full_name: fullName,
      },
      { onConflict: "supabase_user_id" }
    )
    .select("id")
    .single()

  if (insertError || !newUser?.id) {
    console.error("Error creating Supabase user:", insertError)
    return { error: "Não foi possível sincronizar seu usuário" }
  }

  const userId = newUser.id

  // Auto-aceita convites pendentes para este email e cria membership
  const { data: pendingInvites } = await supabase
    .from("workspace_invitations")
    .select("workspace_id, role, id, job_title_id, squad_id")
    .eq("email", email)
    .eq("status", "pending")

  if (pendingInvites && pendingInvites.length > 0) {
    for (const invite of pendingInvites) {
      const accessLevel =
        invite.role === "owner"
          ? "owner"
          : invite.role === "admin"
          ? "admin"
          : "member"

      // PRD Section 2.2: Users are created with job_title_id and seniority_level=null
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: invite.workspace_id,
          user_id: userId,
          access_level: accessLevel,
          role: invite.role === "owner" || invite.role === "admin" ? null : invite.role || null,
          job_title_id: invite.job_title_id || null,
          squad_id: invite.squad_id || null,
          current_seniority_level: null,
          seniority_last_calibrated_at: null,
          seniority_last_assessment_id: null,
        })

      if (memberError) {
        console.error("Error adding member from invitation:", memberError)
      } else {
        await supabase
          .from("workspace_invitations")
          .update({ status: "accepted" })
          .eq("id", invite.id)
      }
    }
  }

  return { userId }
}
