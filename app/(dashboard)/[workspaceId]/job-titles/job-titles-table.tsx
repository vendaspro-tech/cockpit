'use client'

import { Badge } from '@/components/ui/badge'
import { Award, Building2 } from 'lucide-react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface JobTitlesTableProps {
  jobTitles: Array<{
    id: string
    name: string
    slug: string
    hierarchy_level: number
    mission: string | null
    sector: string | null
    subordination: string | null
    allows_seniority: boolean
  }>
  workspaceId: string
}

export function JobTitlesTable({ jobTitles, workspaceId }: JobTitlesTableProps) {
  // O campo subordination já vem do banco, definido na rota admin
  // Não precisa de mapeamento manual

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cargo</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Missão</TableHead>
            <TableHead>Reporta a</TableHead>
            <TableHead>Senioridade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobTitles.map((job) => (
            <TableRow key={job.id}>
              <TableCell>
                <Link href={`/${workspaceId}/job-titles/${job.slug}`}>
                  <span className="font-semibold text-primary hover:underline cursor-pointer">
                    {job.name}
                  </span>
                </Link>
              </TableCell>
              <TableCell>
                {job.sector ? (
                  <div className="flex items-center gap-1 text-sm">
                    <Building2 className="w-3 h-3 text-muted-foreground" />
                    <span>{job.sector}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <p className="text-sm text-muted-foreground max-w-md line-clamp-2">
                  {job.mission || '-'}
                </p>
              </TableCell>
              <TableCell>
                <span className="text-sm">{job.subordination || '-'}</span>
              </TableCell>
              <TableCell>
                {job.allows_seniority ? (
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <Award className="w-3 h-3" />
                    Sim
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Não</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
