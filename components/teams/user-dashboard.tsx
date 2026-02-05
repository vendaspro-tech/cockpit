'use client'

import { X, Mail, Shield, Briefcase, GraduationCap, Target, Package, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface Member {
  id: string
  role: string
  user: {
    id: string
    full_name: string | null
    email: string
  } | null
  job_title: {
    id: string
    name: string
  } | null
}

interface JobTitle {
  id: string
  name: string
}

interface Role {
  slug: string
  name: string
  description: string
}

interface UserDashboardProps {
  member: Member
  jobTitles: JobTitle[]
  roles: Role[]
  onJobTitleChange: (memberId: string, jobTitleId: string) => void
  onRoleChange: (memberId: string, roleSlug: string) => void
  onClose: () => void
}

export function UserDashboard({ member, jobTitles, roles, onJobTitleChange, onRoleChange, onClose }: UserDashboardProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
              <AvatarImage src="" />
              <AvatarFallback className="text-lg">{member.user?.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{member.user?.full_name}</h2>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{member.user?.email}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Função (Sistema)</label>
            <Select 
              defaultValue={member.role} 
              onValueChange={(value) => onRoleChange(member.id, value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.slug} value={role.slug}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cargo (Job Title)</label>
            <Select 
              defaultValue={member.job_title?.id} 
              onValueChange={(value) => onJobTitleChange(member.id, value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                {jobTitles.map((title) => (
                  <SelectItem key={title.id} value={title.id}>
                    {title.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold">4</span>
              <span className="text-xs text-muted-foreground mt-1">PDIs Ativos</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold">2</span>
              <span className="text-xs text-muted-foreground mt-1">Metas</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold">85%</span>
              <span className="text-xs text-muted-foreground mt-1">Score Geral</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold">3</span>
              <span className="text-xs text-muted-foreground mt-1">Produtos</span>
            </CardContent>
          </Card>
        </div>

        {/* Assessments / Levels */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Níveis e Avaliações
            </h3>
            <Button variant="link" size="sm" className="h-auto p-0">Ver histórico</Button>
          </div>
          
          <div className="grid gap-3">
            <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Senioridade (Seller)</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Pleno</Badge>
              </div>
              <Progress value={65} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Última avaliação: 12 Out 2024</span>
                <span className="group-hover:translate-x-1 transition-transform flex items-center">
                  Ver detalhes <ChevronRight className="w-3 h-3 ml-1" />
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Matriz de Competências</span>
                <Badge variant="outline">Em dia</Badge>
              </div>
              <Progress value={82} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Média geral: 8.2</span>
                <span className="group-hover:translate-x-1 transition-transform flex items-center">
                  Ver detalhes <ChevronRight className="w-3 h-3 ml-1" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active PDIs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              PDIs em Andamento
            </h3>
            <Button variant="outline" size="sm">Novo PDI</Button>
          </div>

          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="mt-1 w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium">Melhorar taxa de conversão em fechamento</h4>
                  <p className="text-xs text-muted-foreground mt-1">Prazo: 15 Nov 2024</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Produtos Vinculados
          </h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="px-3 py-1">Consultoria Premium</Badge>
            <Badge variant="secondary" className="px-3 py-1">Mentoria Individual</Badge>
            <Badge variant="outline" className="px-3 py-1 border-dashed text-muted-foreground">+ Adicionar</Badge>
          </div>
        </div>

      </div>
    </div>
  )
}
