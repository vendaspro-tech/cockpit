# Design System

Este documento descreve tokens e padroes de UI para manter consistencia visual.

## Objetivos
- Evitar estilos ad-hoc e cores hardcoded.
- Priorizar componentes em `components/ui/` e composicoes em `components/shared/`.
- Tornar a UI previsivel e escalavel.

## Tokens
Tokens vivem em `app/globals.css` e sao expostos via variaveis CSS.

### Cores semanticas
- Base: `--background`, `--foreground`, `--card`, `--popover`.
- Acoes: `--primary`, `--secondary`, `--accent`, `--destructive`.
- Suporte: `--border`, `--input`, `--ring`, `--muted`.
- Sidebar: `--sidebar-*`.
- Charts: `--chart-1` ate `--chart-5`.

Use classes Tailwind com nomes semanticos:
- `bg-background`, `text-foreground`, `border-border`.
- `bg-primary`, `text-primary-foreground`.
- `bg-muted`, `text-muted-foreground`.

### Tipografia
- Fonte principal: `--font-urbanist` (definida no layout).
- Preferir primitives de tipografia em `components/ui/typography`.
- Use classes utilitarias (`text-sm`, `text-lg`, `font-semibold`) apenas quando necessario.

### Raio
- `--radius` e derivados em `@theme inline`.
- Use `rounded-md`, `rounded-lg` e evite valores hardcoded.

## Componentes base
Preferir os componentes em `components/ui/`:
- Acoes: `Button`, `DropdownMenu`, `Dialog`, `AlertDialog`.
- Estrutura: `Card`, `Table`, `Tabs`, `Accordion`, `Separator`.
- Formulario: `Form`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`.
- Tipografia: `H1`, `H2`, `H3`, `H4`, `Text`, `Lead`, `Muted`.

## UI inventory
- Pagina interna: `/admin/design-system`.
- Use como referencia visual para tokens e componentes.

## Padroes de layout
- Uso de `Card` para blocos de conteudo com titulo e acoes.
- Se for pagina de dados, use `Table` ou `DataTable` (quando existir).
- Evite margens arbitrarias; use `gap-4`, `gap-6`, `gap-8` e `p-4/6/8`.

## Exemplo: Card de KPI
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function KpiCard() {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Conversao
        </CardTitle>
        <Badge variant="secondary">Semanal</Badge>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-semibold text-foreground">32%</div>
          <p className="text-sm text-muted-foreground">+4% vs ultima semana</p>
        </div>
        <Button size="sm" variant="outline">Detalhes</Button>
      </CardContent>
    </Card>
  )
}
```

## Exemplo: Formulario simples
```tsx
import { useForm } from "react-hook-form"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function WorkspaceForm() {
  const form = useForm<{ name: string }>({ defaultValues: { name: "" } })

  return (
    <Form {...form}>
      <form className="grid gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do workspace</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Time Comercial" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Salvar</Button>
      </form>
    </Form>
  )
}
```

## Uso de charts
- Use as variaveis `--chart-*` para cores.
- Evite paletas hardcoded em componentes de grafico.

## Quando adicionar tokens novos
- Atualize `app/globals.css` com variaveis semanticas.
- Evite expor cores diretas; prefira mapear para `--primary`, `--accent`, etc.
