'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createEventCategory, deleteEventCategory, createEventInstructor, deleteEventInstructor } from "@/app/actions/admin/events"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
  color: string
}

interface Instructor {
  id: string
  name: string
  title?: string | null
  email?: string | null
}

interface Template {
  id: string
  name: string
  title: string
  category?: string | null
}

export function CategoryManager({ categories: initial }: { categories: Category[] }) {
  const [categories, setCategories] = useState(initial)
  const [name, setName] = useState("")
  const [color, setColor] = useState("#3b82f6")
  const [pending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleAdd = () => {
    if (!name.trim()) return
    startTransition(async () => {
      const res = await createEventCategory({ name: name.trim(), color })
      if (res.error) {
        toast({ variant: "destructive", title: "Erro", description: res.error })
      } else if (res.category) {
        setCategories(prev => [...prev, res.category!])
        setName("")
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteEventCategory(id)
      if (res.error) {
        toast({ variant: "destructive", title: "Erro", description: res.error })
      } else {
        setCategories(prev => prev.filter(c => c.id !== id))
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="grid gap-2">
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Treinamento Avançado" />
        </div>
        <div className="grid gap-2">
          <Label>Cor</Label>
          <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 p-1" />
        </div>
        <div className="flex items-end">
          <Button onClick={handleAdd} disabled={pending || !name.trim()} className="w-full">
            Adicionar categoria
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Badge
            key={category.id}
            style={{ backgroundColor: category.color, color: "white" }}
            className="flex items-center gap-2"
          >
            {category.name}
            <button
              type="button"
              onClick={() => handleDelete(category.id)}
              className="ml-1 text-xs opacity-80 hover:opacity-100"
              aria-label="Excluir"
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}

export function InstructorManager({ instructors: initial }: { instructors: Instructor[] }) {
  const [instructors, setInstructors] = useState(initial)
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [email, setEmail] = useState("")
  const [pending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleAdd = () => {
    if (!name.trim()) return
    startTransition(async () => {
      const res = await createEventInstructor({ name: name.trim(), title: title.trim() || undefined, email: email.trim() || undefined })
      if (res.error) {
        toast({ variant: "destructive", title: "Erro", description: res.error })
      } else if (res.instructor) {
        setInstructors(prev => [...prev, res.instructor!])
        setName("")
        setTitle("")
        setEmail("")
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteEventInstructor(id)
      if (res.error) {
        toast({ variant: "destructive", title: "Erro", description: res.error })
      } else {
        setInstructors(prev => prev.filter(i => i.id !== id))
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="grid gap-2">
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do instrutor" />
        </div>
        <div className="grid gap-2">
          <Label>Título/Cargo</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Head de CS" />
        </div>
        <div className="grid gap-2">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@exemplo.com" />
        </div>
      </div>
      <Button onClick={handleAdd} disabled={pending || !name.trim()}>
        Adicionar instrutor
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {instructors.map(instr => (
          <div key={instr.id} className="rounded-lg border p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{instr.name}</div>
              <div className="text-xs text-muted-foreground">
                {[instr.title, instr.email].filter(Boolean).join(" • ")}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(instr.id)}>
              Excluir
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TemplatesPanel({ templates }: { templates: Template[] }) {
  if (!templates.length) {
    return <p className="text-sm text-muted-foreground">Use “Salvar como template” no formulário de evento para criar seus modelos.</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {templates.map(tpl => (
        <div key={tpl.id} className="border rounded-lg p-3">
          <div className="text-sm text-muted-foreground">Template</div>
          <div className="font-semibold">{tpl.name}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {tpl.title} {tpl.category ? `• ${tpl.category}` : ""}
          </div>
        </div>
      ))}
    </div>
  )
}
