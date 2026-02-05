'use client'

import { Consultancy } from "@/app/actions/comercial-pro"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Video, User as UserIcon, FileText, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ConsultanciesViewProps {
  initialConsultancies: Consultancy[]
  workspaceId: string
}

export function ConsultanciesView({ initialConsultancies, workspaceId }: ConsultanciesViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Histórico de Consultorias</h2>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead>Gravação</TableHead>
              <TableHead>Plano de Ação Vinculado</TableHead>
              <TableHead>Comentários</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialConsultancies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma consultoria registrada.
                </TableCell>
              </TableRow>
            ) : (
              initialConsultancies.map((consultancy) => (
                <TableRow key={consultancy.id}>
                  <TableCell>
                    {format(new Date(consultancy.date), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{consultancy.mentor?.full_name || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {consultancy.recording_link ? (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={consultancy.recording_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Assistir
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {consultancy.action_plan ? (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{consultancy.action_plan.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={consultancy.comments || ''}>
                    {consultancy.comments || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
