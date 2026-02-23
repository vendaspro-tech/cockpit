"use client"

import { type Dispatch, type SetStateAction, useMemo, useState } from "react"
import Link from "next/link"
import { Bot, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AgentCard } from "@/app/actions/ai-agents"

type AgentLibraryFiltersProps = {
  agents: AgentCard[]
  workspaceId: string
}

function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string, checked: boolean) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between">
          {label} {selected.length > 0 ? `(${selected.length})` : ""}
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selected.includes(option)}
            onCheckedChange={(checked) => onToggle(option, checked === true)}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AgentLibraryFilters({ agents, workspaceId }: AgentLibraryFiltersProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const productOptions = useMemo(
    () => Array.from(new Set(agents.flatMap((agent) => agent.product_tags || []))).sort(),
    [agents]
  )
  const nameOptions = useMemo(
    () => Array.from(new Set(agents.map((agent) => agent.name))).sort(),
    [agents]
  )
  const categoryOptions = useMemo(
    () => Array.from(new Set(agents.flatMap((agent) => agent.category_tags || []))).sort(),
    [agents]
  )

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesProduct =
        selectedProducts.length === 0 ||
        selectedProducts.some((product) => (agent.product_tags || []).includes(product))
      const matchesName = selectedNames.length === 0 || selectedNames.includes(agent.name)
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((category) => (agent.category_tags || []).includes(category))
      return matchesProduct && matchesName && matchesCategory
    })
  }, [agents, selectedProducts, selectedNames, selectedCategories])

  const toggleItem = (
    value: string,
    checked: boolean,
    setState: Dispatch<SetStateAction<string[]>>
  ) => {
    setState((current) => {
      if (checked) return Array.from(new Set([...current, value]))
      return current.filter((item) => item !== value)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <FilterDropdown
          label="Produto"
          options={productOptions}
          selected={selectedProducts}
          onToggle={(value, checked) => toggleItem(value, checked, setSelectedProducts)}
        />
        <FilterDropdown
          label="Nome"
          options={nameOptions}
          selected={selectedNames}
          onToggle={(value, checked) => toggleItem(value, checked, setSelectedNames)}
        />
        <FilterDropdown
          label="Categoria"
          options={categoryOptions}
          selected={selectedCategories}
          onToggle={(value, checked) => toggleItem(value, checked, setSelectedCategories)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAgents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription>{agent.description || "Sem descrição"}</CardDescription>
              <div className="flex flex-wrap gap-1">
                {(agent.product_tags || []).map((tag) => (
                  <Badge key={`p-${agent.id}-${tag}`} variant="outline">
                    {tag}
                  </Badge>
                ))}
                {(agent.category_tags || []).map((tag) => (
                  <Badge key={`c-${agent.id}-${tag}`} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button asChild size="sm" className="w-full">
                <Link href={`/${workspaceId}/agents/${agent.id}`}>Conversar</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <Card className="flex flex-col items-center justify-center border-dashed p-6 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Bot className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Nenhum agente encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Ajuste os filtros para visualizar agentes disponíveis.
          </p>
        </Card>
      )}
    </div>
  )
}
