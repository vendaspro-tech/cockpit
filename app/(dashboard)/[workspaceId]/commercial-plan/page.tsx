import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { getWorkspaceCommercialPlans } from '@/app/actions/commercial-plans'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface CommercialPlansPageProps {
  params: Promise<{
    workspaceId: string
  }>
}

type PlanStatus = 'draft' | 'pending_approval' | 'revision' | 'approved' | 'active' | 'archived'

const statusColors: Record<PlanStatus, string> = {
  draft: 'bg-gray-500',
  pending_approval: 'bg-yellow-500',
  revision: 'bg-orange-500',
  approved: 'bg-green-500',
  active: 'bg-blue-500',
  archived: 'bg-gray-400'
}

const statusLabels: Record<PlanStatus, string> = {
  draft: 'Rascunho',
  pending_approval: 'Pendente',
  revision: 'Revisão',
  approved: 'Aprovado',
  active: 'Ativo',
  archived: 'Arquivado'
}

async function PlansList({ workspaceId }: { workspaceId: string }) {
  const { data: plans, error } = await getWorkspaceCommercialPlans(workspaceId)

  if (error) {
    if (error.includes('Access denied') || error.includes('hierarchy')) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-lg bg-yellow-50 p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-sm text-muted-foreground">
              Apenas usuários com cargos <strong>Estratégicos</strong> (Gerente Comercial) 
              ou <strong>Táticos</strong> (Coordenador Comercial) podem acessar o módulo 
              de Planejamento Comercial.
            </p>
          </div>
        </div>
      )
    }

    return <div className="text-destructive">Erro ao carregar planos: {error}</div>
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-lg border-2 border-dashed p-12 max-w-md">
          <h3 className="text-lg font-semibold mb-2">Nenhum plano comercial ainda</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crie seu primeiro plano comercial para começar a planejar suas metas e estrutura de time.
          </p>
          <Button asChild>
            <Link href={`/${workspaceId}/commercial-plan/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Plano
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ano</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Meta Global</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">{plan.year}</TableCell>
              <TableCell>{plan.name}</TableCell>
              <TableCell>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: plan.currency
                }).format(plan.global_target)}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[plan.status as PlanStatus]}>
                  {statusLabels[plan.status as PlanStatus]}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(plan.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${workspaceId}/commercial-plan/${plan.id}`}>
                    Abrir
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default async function CommercialPlansPage({ params }: CommercialPlansPageProps) {
  const user = await getAuthUser()
  if (!user) {
    redirect('/sign-in')
  }

  // Next.js 16: params is now a Promise
  const { workspaceId } = await params

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Planos Comerciais</h2>
          <p className="text-muted-foreground">
            Planejamento estratégico de metas e estrutura de vendas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href={`/${workspaceId}/commercial-plan/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <PlansList workspaceId={workspaceId} />
      </Suspense>
    </div>
  )
}
