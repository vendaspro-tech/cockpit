'use client'

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter } from "lucide-react"

interface TaskFiltersProps {
  showPDI: boolean
  setShowPDI: (show: boolean) => void
  showStandalone: boolean
  setShowStandalone: (show: boolean) => void
  showCompleted: boolean
  setShowCompleted: (show: boolean) => void
}

export function TaskFilters({
  showPDI,
  setShowPDI,
  showStandalone,
  setShowStandalone,
  showCompleted,
  setShowCompleted
}: TaskFiltersProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Filter className="w-3.5 h-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Filtrar
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Tipo de Tarefa</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={showPDI}
          onCheckedChange={setShowPDI}
        >
          Ações de PDI
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showStandalone}
          onCheckedChange={setShowStandalone}
        >
          Tarefas Avulsas
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={showCompleted}
          onCheckedChange={setShowCompleted}
        >
          Mostrar Concluídas
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
