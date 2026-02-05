'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, LogOut, Upload, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface UserData {
  id: string
  email: string | undefined
  fullName: string
  avatarUrl: string
}

interface AccountSettingsProps {
  userData: UserData
  role: string
}

export function AccountSettings({ userData, role }: AccountSettingsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(userData.fullName)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(userData.avatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const roleLabels: Record<string, string> = {
    'system_owner': 'Proprietário do Sistema',
    'owner': 'Proprietário',
    'admin': 'Administrador',
    'member': 'Membro'
  }

  const handleSaveName = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      })
      
      if (error) throw error
      
      toast({
        title: "Nome atualizado!",
        description: "Seu nome foi atualizado com sucesso.",
      })
      setIsEditing(false)
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userData.id}-${Date.now()}.${fileExt}`
      const filePath = `${userData.id}/${fileName}`

      // Upload to Supabase Storage (user-avatars bucket)
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath)

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Minha Conta</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie suas informações pessoais e de acesso.
        </p>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Seus dados de identificação no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} alt={fullName || userData.email || ''} />
                  <AvatarFallback className="text-lg">
                    {fullName?.charAt(0) || userData.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-3 w-3" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              <div className="flex-1 space-y-2">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Seu nome completo"
                      />
                      <Button onClick={handleSaveName} size="sm">Salvar</Button>
                      <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold">{fullName || userData.email}</h3>
                      <Button 
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="w-4 h-4 mr-2" />
                      {userData.email}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Permissões no Workspace
            </CardTitle>
            <CardDescription>
              Seu nível de acesso neste workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/5">
              <div className="space-y-1">
                <p className="text-sm font-medium">Cargo Atual</p>
                <p className="text-xs text-muted-foreground">
                  Define o que você pode ver e editar.
                </p>
              </div>
              <Badge variant={role === 'system_owner' || role === 'owner' ? 'default' : 'secondary'}>
                {roleLabels[role || 'member'] || role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="w-5 h-5" />
              Sair da conta
            </CardTitle>
            <CardDescription>
              Encerrar sua sessão atual.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
             <p className="text-sm text-muted-foreground">Você será redirecionado para a página de login.</p>
             <SignOutButton />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SignOutButton() {
   const handleSignOut = async () => {
       const supabase = createClient()
       await supabase.auth.signOut()
       window.location.href = "/login"
   }

   return (
       <Button variant="destructive" onClick={handleSignOut}>
           Sair
       </Button>
   )
}
