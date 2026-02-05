'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, Table as TableIcon } from 'lucide-react'
import Link from 'next/link'
import { ICPCard } from './icp-card'
import { deleteICP } from '@/app/actions/icp'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import type { IcpWithProducts } from '@/lib/types/icp'

interface ICPListProps {
  icps: IcpWithProducts[]
  workspaceId: string
}

export function ICPList({ icps, workspaceId }: ICPListProps) {
  const router = useRouter()
  const [view, setView] = useState('gallery')

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este ICP?')) {
      try {
        await deleteICP(id, workspaceId)
        toast.success('ICP excluído com sucesso')
        router.refresh()
      } catch {
        toast.error('Erro ao excluir ICP')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={setView} className="w-[400px]">
          <TabsList>
            <TabsTrigger value="gallery">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Galeria
            </TabsTrigger>
            <TabsTrigger value="table">
              <TableIcon className="w-4 h-4 mr-2" />
              Tabela
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button asChild>
          <Link href={`/${workspaceId}/products/icp/new`}>
            <Plus className="w-4 h-4 mr-2" />
            Novo ICP
          </Link>
        </Button>
      </div>

      <Tabs value={view} className="w-full">
        <TabsContent value="gallery" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {icps.map((icp) => (
              <ICPCard 
                key={icp.id} 
                icp={icp} 
                workspaceId={workspaceId} 
                onDelete={handleDelete}
              />
            ))}
            {icps.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Nenhum ICP cadastrado. Clique em &quot;Novo ICP&quot; para começar.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Profissão</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Faixa Etária</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {icps.map((icp) => (
                  <TableRow key={icp.id}>
                    <TableCell className="font-medium">{icp.name}</TableCell>
                    <TableCell>{icp.profession}</TableCell>
                    <TableCell>{icp.location}</TableCell>
                    <TableCell>{icp.age_range}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(icp.icp_products?.length ?? 0) > 0 ? (
                          <Badge variant="outline">{icp.icp_products?.length ?? 0} produtos</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/${workspaceId}/products/icp/${icp.id}`}>
                          Editar
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {icps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum ICP cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
