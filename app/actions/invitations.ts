'use server'

import { revalidatePath } from "next/cache"
import { getWorkspacePlanUsage } from "./plans"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserRole } from "@/lib/auth-utils"
import { ensureSupabaseUser } from "@/lib/supabase/user"
import { createClient } from "@/lib/supabase/server"

export async function createInvitation(
  workspaceId: string,
  email: string,
  name?: string,
  role: string = 'member',
  jobTitleId?: string
) {
  const supabaseServer = await createClient()
  const { data: authData } = await supabaseServer.auth.getUser()
  const authUserId = authData.user?.id

  if (!authUserId) {
    return { error: 'Não autenticado' }
  }

  // Validate job_title_id is required (PRD Section 2.2)
  if (!jobTitleId) {
    return { error: 'Cargo é obrigatório para convidar um novo membro' }
  }

  // Check plan limits
  const usage = await getWorkspacePlanUsage(workspaceId)
  if (usage.maxUsers !== null && usage.currentUsers >= usage.maxUsers) {
    return {
      error: `Limite de usuários atingido. Seu plano permite ${usage.maxUsers} usuários.`
    }
  }

  // Verify membership to ensure security
  const userRole = await getUserRole(authUserId, workspaceId)
  const canInvite = userRole === 'system_owner' || userRole === 'owner' || userRole === 'admin'

  if (!canInvite) {
    return { error: 'Permissão insuficiente para convidar membros' }
  }

  const supabase = createAdminClient()

  // Get inviter user from database
  const { userId: inviterId } = await ensureSupabaseUser(authUserId)

  // Check if user already exists in auth
  console.log('Checking if user exists:', email)
  const { data: existingAuthUser } = await supabase.auth.admin.listUsers()
  const userExists = existingAuthUser?.users?.find(u => u.email === email)

  if (userExists) {
    console.log('User already exists, adding to workspace directly', {
      authUserId: userExists.id,
      email: userExists.email
    })

    // Get or create user in our users table
    const { data: appUser, error: getUserError } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_user_id', userExists.id)
      .single()

    console.log('App user lookup result:', { appUser, getUserError })

    let appUserId = appUser?.id

    if (!appUserId) {
      // Create user record if doesn't exist
      console.log('Creating new user record in users table')
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          supabase_user_id: userExists.id,
          email: userExists.email,
          full_name: userExists.user_metadata?.full_name || name || userExists.email?.split('@')[0]
        })
        .select('id')
        .single()

      console.log('User creation result:', { newUser, createUserError })

      if (createUserError) {
        console.error('Error creating user:', createUserError)
        return { error: `Erro ao criar registro de usuário: ${createUserError.message}` }
      }

      appUserId = newUser.id
    }

    console.log('Using appUserId:', appUserId)

    // Check if user is already in this workspace
    const { data: existingMember, error: checkMemberError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', appUserId)
      .single()

    console.log('Existing member check:', { existingMember, checkMemberError })

    if (existingMember) {
      return { error: 'Este usuário já é membro deste workspace' }
    }

    // Add user to workspace
    console.log('Adding user to workspace:', {
      workspace_id: workspaceId,
      user_id: appUserId,
      role: role,
      job_title_id: jobTitleId
    })

    const { data: newMember, error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: appUserId,
        role: role,
        access_level: role, // Legacy field - same as role
        job_title_id: jobTitleId
      })
      .select()

    console.log('Workspace member insert result:', { newMember, memberError })

    if (memberError) {
      console.error('Error adding member to workspace:', memberError)
      return { error: `Erro ao adicionar usuário ao workspace: ${memberError.message || memberError.code}` }
    }

    revalidatePath(`/${workspaceId}/teams`)
    revalidatePath(`/${workspaceId}/settings`)
    return { success: true, message: 'Usuário adicionado ao workspace com sucesso' }
  }

  // User doesn't exist - send invitation email
  console.log('Sending invitation with data:', { email, workspaceId, role, jobTitleId })

  const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { workspaceId, role, jobTitleId },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  })

  if (inviteError) {
    console.error('Error sending invitation email:', inviteError)
    return { error: `Erro ao enviar convite: ${inviteError.message || 'Desconhecido'}` }
  }

  // Track invitation in our database with job_title_id
  console.log('Tracking invitation in database...')

  const { error: dbError } = await supabase
    .from('workspace_invitations')
    .insert({
      workspace_id: workspaceId,
      email,
      invited_by: inviterId || null,
      status: 'pending',
      role: role,
      job_title_id: jobTitleId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })

  if (dbError) {
    console.error('Error tracking invitation:', dbError)
    return { error: `Erro ao registrar convite: ${dbError.message || dbError.code || 'Desconhecido'}` }
  }

  revalidatePath(`/${workspaceId}/teams`)
  revalidatePath(`/${workspaceId}/settings`)
  return { success: true }
}

export async function getWorkspaceInvitations(workspaceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workspace_invitations')
    .select(`
      *,
      inviter:users!invited_by(full_name, email)
    `)
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invitations:', error)
    return []
  }

  return data
}

export async function revokeInvitation(invitationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workspace_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId)

  if (error) {
    console.error('Error revoking invitation:', error)
    return { error: 'Erro ao revogar convite' }
  }

  return { success: true }
}
