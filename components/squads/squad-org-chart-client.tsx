'use client'

import { SquadOrgChart } from './squad-org-chart'
import { Squad } from '@/app/actions/squads'
import { useRouter } from 'next/navigation'

interface SquadOrgChartClientProps {
  workspaceId: string
  workspaceName: string
  squads: Squad[]
  members: Array<{
    user?: { id: string; full_name?: string | null; email: string }
    job_title?: { name: string } | null
  }>
}

export function SquadOrgChartClient({ workspaceId, workspaceName, squads, members }: SquadOrgChartClientProps) {
  const router = useRouter()

  const handleSquadUpdate = () => {
    router.refresh()
  }

  return (
    <SquadOrgChart
      workspaceId={workspaceId}
      workspaceName={workspaceName}
      squads={squads}
      members={members}
      onSquadUpdate={handleSquadUpdate}
    />
  )
}
