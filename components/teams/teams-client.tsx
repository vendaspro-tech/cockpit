'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InviteUserDialog } from "./invite-user-dialog"
import { SquadOrgChartClient } from "@/components/squads/squad-org-chart-client"
import { Users, Network } from "lucide-react"
import { Squad } from "@/app/actions/squads"
import { MembersList } from "./members-list"

interface TeamsClientProps {
  workspaceId: string
  workspaceName: string
  members: any[]
  jobTitles: any[]
  roles: any[]
  planUsage: any
  squads: Squad[]
}

export function TeamsClient({
  workspaceId,
  workspaceName,
  members,
  jobTitles,
  roles,
  planUsage,
  squads
}: TeamsClientProps) {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-background">
        <div>
          <h1 className="text-2xl font-bold">Time</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os membros do seu time e organize em squads.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {members.length} membros • {squads.length} squads
          </div>
          <InviteUserDialog
            workspaceId={workspaceId}
            currentUsers={planUsage.currentUsers}
            maxUsers={planUsage.maxUsers}
            planName={planUsage.planName || 'Free'}
            roles={roles}
          />
        </div>
      </div>

      <Tabs defaultValue="members" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-4">
          <TabsList className="grid w-full max-w-lg grid-cols-2">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="squads" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Squads
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="members" className="flex-1 m-0">
          <MembersList
            workspaceId={workspaceId}
            members={members}
            jobTitles={jobTitles}
            roles={roles}
          />
        </TabsContent>

        <TabsContent value="squads" className="flex-1 m-0 p-4">
          <SquadOrgChartClient
            workspaceId={workspaceId}
            workspaceName={workspaceName}
            squads={squads}
            members={members}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
