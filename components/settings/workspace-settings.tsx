import { WorkspaceSettingsForm } from "@/components/settings/workspace-settings-form"

interface WorkspaceSettingsProps {
  workspace: any
}

export function WorkspaceSettings({ workspace }: WorkspaceSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configurações do Workspace</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie o nome e logo do seu workspace.
        </p>
      </div>
      <WorkspaceSettingsForm 
        workspaceId={workspace.id} 
        initialData={workspace} 
      />
    </div>
  )
}
