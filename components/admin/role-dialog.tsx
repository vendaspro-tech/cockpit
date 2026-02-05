'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { createRole, updateRole } from "@/app/actions/admin/roles"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SYSTEM_PERMISSIONS } from "@/lib/permissions"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Role {
  slug: string
  name: string
  description: string
  permissions: Record<string, boolean>
  is_system_role: boolean
}

interface RoleDialogProps {
  role?: Role
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function RoleDialog({ role, trigger, open, onOpenChange }: RoleDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen

  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    description: "",
    permissions: {} as Record<string, boolean>
  })

  // Reset form when dialog opens or role changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        slug: role?.slug || "",
        name: role?.name || "",
        description: role?.description || "",
        permissions: role?.permissions || {}
      })
    }
  }, [isOpen, role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        slug: formData.slug,
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
        is_system_role: role?.is_system_role || false
      }

      const result = role 
        ? await updateRole(role.slug, payload)
        : await createRole(payload)

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error
        })
      } else {
        toast({
          title: "Sucesso",
          description: role ? "Cargo atualizado com sucesso" : "Cargo criado com sucesso"
        })
        setIsOpen(false)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePermission = (key: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: checked
      }
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <DialogHeader>
            <DialogTitle>{role ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
            <DialogDescription>
              {role?.is_system_role 
                ? "Este é um cargo do sistema. Algumas opções podem estar bloqueadas." 
                : "Defina as informações e permissões do cargo."}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="permissions">Permissões</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto py-4">
              <TabsContent value="details" className="mt-0 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="slug">Identificador (Slug)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="ex: gerente_regional"
                    disabled={!!role}
                    required
                  />
                  {!role && (
                    <p className="text-xs text-muted-foreground">
                      Usado internamente. Apenas letras minúsculas, números e underline.
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Gerente Regional"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva as responsabilidades deste cargo..."
                  />
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="mt-0 h-full">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-6">
                    {Object.entries(SYSTEM_PERMISSIONS).map(([categoryKey, category]) => (
                      <div key={categoryKey} className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                          {category.label}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {category.permissions.map((permission) => (
                            <div key={permission.key} className="flex items-start space-x-2">
                              <Checkbox 
                                id={permission.key} 
                                checked={!!formData.permissions[permission.key]}
                                onCheckedChange={(checked) => togglePermission(permission.key, checked as boolean)}
                                disabled={role?.slug === 'owner'}
                              />
                              <div className="grid gap-1.5 leading-none">
                                <Label 
                                  htmlFor={permission.key}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {permission.label}
                                </Label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
