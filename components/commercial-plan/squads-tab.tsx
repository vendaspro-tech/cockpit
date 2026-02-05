'use client'

import { useState, useEffect, useCallback } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Users, Trash2, Info, Network, List } from 'lucide-react'
import {
  getPlanSquads,
  deletePlanSquad,
  type PlanSquadSimple
} from '@/app/actions/commercial-plans-squads'
import { CreateSquadDialog } from './create-squad-dialog'
import { EditSquadDialog } from './edit-squad-dialog'
import { SquadMembersDialog } from './squad-members-dialog'
import { LinkProductsDialog } from './link-products-dialog'
import { SquadKPIsModal } from './squad-kpis-modal'
import { SquadsFlowView } from './squads-flow-view'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SquadsTabProps {
  plan: {
    id: string
    workspace_id: string
    use_squads: boolean
    workspace?: {
      name: string
    }
  }
}

export function SquadsTab({ plan }: SquadsTabProps) {
  const [squads, setSquads] = useState<PlanSquadSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingSquad, setEditingSquad] = useState<PlanSquadSimple | null>(null)
  const [membersSquad, setMembersSquad] = useState<PlanSquadSimple | null>(null)
  const [deletingSquad, setDeletingSquad] = useState<PlanSquadSimple | null>(null)
  const [linkingSquad, setLinkingSquad] = useState<PlanSquadSimple | null>(null)
  const [kpisSquad, setKpisSquad] = useState<PlanSquadSimple | null>(null)
  const { toast } = useToast()

  const loadSquads = useCallback(async () => {
    setLoading(true)
    const result = await getPlanSquads(plan.id)
    if (result.data) {
      setSquads(result.data)
    } else if (result.error) {
      toast({
        title: 'Erro ao carregar squads',
        description: result.error,
        variant: 'destructive'
      })
    }
    setLoading(false)
  }, [plan.id, toast])

  useEffect(() => {
    loadSquads()
  }, [loadSquads])

  const handleDelete = async () => {
    if (!deletingSquad) return

    const result = await deletePlanSquad(deletingSquad.squad_id, plan.id)
    
    if (result.success) {
      toast({
        title: 'Squad removido',
        description: 'Squad foi removido com sucesso'
      })
      setDeletingSquad(null)
      await loadSquads()
    } else {
      toast({
        title: 'Erro ao remover squad',
        description: result.error || 'Erro desconhecido',
        variant: 'destructive'
      })
    }
  }

  const handleViewKPIs = (squadId: string) => {
    const squad = squads.find(s => s.squad_id === squadId)
    if (squad) {
      setKpisSquad(squad)
    }
  }

  const handleLinkProducts = (squadId: string) => {
    const squad = squads.find(s => s.squad_id === squadId)
    if (squad) {
      setLinkingSquad(squad)
    }
  }

  const handleAddMembers = (squadId: string) => {
    const squad = squads.find(s => s.squad_id === squadId)
    if (squad) {
      setMembersSquad(squad)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-40 bg-muted rounded" />
          <div className="grid gap-4">
            <div className="h-40 bg-muted rounded" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Info Box */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Squads organizam sua equipe. Vincule produtos aos squads diretamente no organograma ou na visualização em lista.
          O share do squad é calculado automaticamente pela soma dos shares dos produtos vinculados.
        </AlertDescription>
      </Alert>

      {/* Tabs: Flow vs List View */}
      <Tabs defaultValue="flow" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="flow" className="gap-2">
              <Network className="h-4 w-4" />
              Organograma
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
          </TabsList>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Squad
          </Button>
        </div>

        {/* Flow View */}
        <TabsContent value="flow" className="mt-0">
          <ReactFlowProvider>
            <SquadsFlowView
              squads={squads}
              workspaceName={plan.workspace?.name || 'Workspace'}
              onCreateSquad={() => setCreateDialogOpen(true)}
              onViewKPIs={handleViewKPIs}
              onLinkProducts={handleLinkProducts}
              onAddMembers={handleAddMembers}
            />
          </ReactFlowProvider>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-0">
          {squads.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="max-w-sm mx-auto space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">Nenhum squad criado</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crie squads para organizar sua equipe e distribuir produtos
                  </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Squad
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {squads.map((squad) => (
                <Card key={squad.squad_id} className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: squad.color }}
                        >
                          {squad.squad_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{squad.squad_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            {squad.leader_name && (
                              <span>Líder: {squad.leader_name}</span>
                            )}
                            {!squad.leader_name && (
                              <span className="text-yellow-600">Sem líder</span>
                            )}
                            <span>•</span>
                            <span>{squad.member_count} {squad.member_count === 1 ? 'membro' : 'membros'}</span>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={squad.share_calculated > 0 ? "default" : "secondary"}
                        className="text-base font-semibold"
                      >
                        Share: {(squad.share_calculated * 100).toFixed(0)}%
                      </Badge>
                    </div>

                    {/* Description */}
                    {squad.description && (
                      <p className="text-sm text-muted-foreground">{squad.description}</p>
                    )}

                    {/* Products */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">
                        Produtos vinculados ({squad.products.length}):
                      </p>
                      {squad.products.length > 0 ? (
                        <div className="space-y-1.5">
                          {squad.products.map((product) => (
                            <div 
                              key={product.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="font-medium">{product.name}</span>
                              <Badge variant="outline">
                                {(product.share_target * 100).toFixed(0)}% do plano
                              </Badge>
                            </div>
                          ))}
                          <div className="pt-2 border-t mt-2 flex items-center justify-between font-semibold text-sm">
                            <span>Total do Squad</span>
                            <span>{(squad.share_calculated * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Nenhum produto vinculado ainda
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLinkProducts(squad.squad_id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Vincular Produtos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSquad(squad)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMembersSquad(squad)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Membros
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingSquad(squad)}
                        className="ml-auto text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateSquadDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        workspaceId={plan.workspace_id}
        onSuccess={loadSquads}
      />

      {editingSquad && (
        <EditSquadDialog
          open={!!editingSquad}
          onOpenChange={(open: boolean) => !open && setEditingSquad(null)}
          squad={editingSquad}
          onSuccess={loadSquads}
        />
      )}

      {membersSquad && (
        <SquadMembersDialog
          open={!!membersSquad}
          onOpenChange={(open: boolean) => !open && setMembersSquad(null)}
          squad={membersSquad}
          workspaceId={plan.workspace_id}
          onSuccess={loadSquads}
        />
      )}

      {linkingSquad && (
        <LinkProductsDialog
          open={!!linkingSquad}
          onOpenChange={(open: boolean) => !open && setLinkingSquad(null)}
          planId={plan.id}
          squadId={linkingSquad.squad_id}
          squadName={linkingSquad.squad_name}
          onSuccess={loadSquads}
        />
      )}

      {kpisSquad && (
        <SquadKPIsModal
          open={!!kpisSquad}
          onOpenChange={(open: boolean) => !open && setKpisSquad(null)}
          planId={plan.id}
          squadId={kpisSquad.squad_id}
          squadName={kpisSquad.squad_name}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSquad} onOpenChange={(open: boolean) => !open && setDeletingSquad(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover squad?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a remover o squad <strong>{deletingSquad?.squad_name}</strong>.
              </p>
              {deletingSquad && deletingSquad.member_count > 0 && (
                <p className="text-yellow-600">
                  ⚠️ Este squad tem {deletingSquad.member_count} {deletingSquad.member_count === 1 ? 'membro' : 'membros'}. {deletingSquad.member_count === 1 ? 'Ele será removido' : 'Eles serão removidos'} também.
                </p>
              )}
              {deletingSquad && deletingSquad.products.length > 0 && (
                <p className="text-red-600">
                  ❌ Este squad tem {deletingSquad.products.length} {deletingSquad.products.length === 1 ? 'produto vinculado' : 'produtos vinculados'}. Desvincule os produtos primeiro.
                </p>
              )}
              <p>Esta ação não pode ser desfeita.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletingSquad ? deletingSquad.products.length > 0 : false}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
