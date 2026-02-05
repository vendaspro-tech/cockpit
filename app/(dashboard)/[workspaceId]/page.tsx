import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { getUserRole } from '@/lib/auth-utils'

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params
  const user = await getAuthUser()
  
  if (!user) {
    redirect('/sign-in')
  }
  
  const role = await getUserRole(user.id, workspaceId)
  
  // Redirect to appropriate dashboard based on role
  const redirectMap: Record<string, string> = {
    closer: `/${workspaceId}/overview`,
    sdr: `/${workspaceId}/overview`,
    leader: `/${workspaceId}/overview`,
    admin: `/${workspaceId}/overview`,
    owner: `/${workspaceId}/overview`
  }
  
  const destination = redirectMap[role || 'closer'] || `/${workspaceId}/overview`
  redirect(destination)
}
