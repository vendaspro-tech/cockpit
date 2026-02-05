import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ensureSupabaseUser } from '@/lib/supabase/user'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? '/'

  console.log('Auth callback:', { token_hash, type, next })

  if (token_hash && type) {
    const supabase = await createClient()

    // Exchange the token for a session
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    console.log('VerifyOtp result:', { data, error })

    if (!error && data.user) {
      // Ensure user exists in our database
      await ensureSupabaseUser(data.user.id)

      // Check if this is an invitation with workspace data
      const workspaceId = data.user.user_metadata?.workspaceId
      const role = data.user.user_metadata?.role
      const jobTitleId = data.user.user_metadata?.jobTitleId

      console.log('User metadata:', { workspaceId, role, jobTitleId })

      if (workspaceId && jobTitleId) {
        // This is an invitation - add user to workspace
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const adminClient = createAdminClient()

        // Get user ID from our database
        const { data: appUser } = await adminClient
          .from('users')
          .select('id')
          .eq('supabase_user_id', data.user.id)
          .single()

        if (appUser) {
          // Check if not already a member
          const { data: existingMember } = await adminClient
            .from('workspace_members')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('user_id', appUser.id)
            .single()

          if (!existingMember) {
            // Add to workspace
            await adminClient
              .from('workspace_members')
              .insert({
                workspace_id: workspaceId,
                user_id: appUser.id,
                role: role || 'member',
                access_level: role || 'member',
                job_title_id: jobTitleId
              })

            console.log('Added user to workspace:', { workspaceId, userId: appUser.id })
          }
        }

        // Redirect to the workspace
        return NextResponse.redirect(`${requestUrl.origin}/${workspaceId}`)
      }

      // No workspace - redirect to default page or onboarding
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }

    if (error) {
      console.error('Auth callback error:', error)
      // Redirect to login with error
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`
      )
    }
  }

  // No token - redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
