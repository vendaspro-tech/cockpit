'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreatePDIDialog } from "./create-pdi-dialog"

interface CreatePDIButtonProps {
  assessments: any[]
  workspaceId: string
}

export function CreatePDIButton({ assessments, workspaceId }: CreatePDIButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Criar PDI
      </Button>
      <CreatePDIDialog 
        open={open}
        onOpenChange={setOpen}
        assessments={assessments}
        workspaceId={workspaceId}
      />
    </>
  )
}
