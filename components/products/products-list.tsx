'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  ArrowUpDown,
  Search,
  ExternalLink,
  ShoppingCart,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Gift
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'
import { deleteProduct } from '@/app/actions/products'
import { toast } from 'sonner'
import { TableEmptyState } from '@/components/shared'

interface Product {
  id: string
  name: string
  description: string | null
  standard_price: number | null
  updated_at: string
  value_ladder_level: string | null
  type: string | null
  sales_page_url: string | null
  checkout_url: string | null
  product_benefits: [{ count: number }]
  product_offers: [{ count: number }]
  product_objections: [{ count: number }]
  product_refusal_reasons: [{ count: number }]
  product_sales_scripts: [{ count: number }]
}

interface ProductsListProps {
  data: any[] // Using any[] to bypass strict type check for now as the data comes from Supabase join
  workspaceId: string
}

const LEVEL_COLORS: Record<string, string> = {
  'Front End': 'bg-blue-100 text-blue-700 border-blue-200',
  'Back End': 'bg-purple-100 text-purple-700 border-purple-200',
  'High End': 'bg-amber-100 text-amber-700 border-amber-200',
}

const TYPE_COLORS: Record<string, string> = {
  'Curso': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Comunidade': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Mentoria': 'bg-rose-100 text-rose-700 border-rose-200',
  'Consultoria': 'bg-slate-100 text-slate-700 border-slate-200',
  'Ebook': 'bg-orange-100 text-orange-700 border-orange-200',
  'SaaS': 'bg-cyan-100 text-cyan-700 border-cyan-200',
}

export function ProductsList({ data, workspaceId }: ProductsListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = data.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: string, name: string) => {
    const loadingToast = toast.loading(`Excluindo ${name}...`)
    try {
      await deleteProduct(id, workspaceId)
      toast.dismiss(loadingToast)
      toast.success(`Produto "${name}" excluído com sucesso!`)
    } catch (error) {
      console.error('Erro ao excluir produto', error)
      toast.dismiss(loadingToast)
      toast.error('Erro ao excluir produto')
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar produtos..." 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[200px]">Nome</TableHead>
            <TableHead>Nível</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <CheckCircle2 className="w-4 h-4 mx-auto" />
                  </TooltipTrigger>
                  <TooltipContent>Benefícios</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead className="text-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Gift className="w-4 h-4 mx-auto" />
                  </TooltipTrigger>
                  <TooltipContent>Ofertas</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead className="text-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="w-4 h-4 mx-auto" />
                  </TooltipTrigger>
                  <TooltipContent>Objeções</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead className="text-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <XCircle className="w-4 h-4 mx-auto" />
                  </TooltipTrigger>
                  <TooltipContent>Perdas</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead className="text-center">Script</TableHead>
            <TableHead className="text-center">Links</TableHead>
            <TableHead>Preço Padrão</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length === 0 ? (
            <TableEmptyState 
              colSpan={11} 
              message={searchTerm ? 'Nenhum produto encontrado com esse termo.' : 'Nenhum produto encontrado.'}
              className="h-32"
            />
          ) : (
            filteredData.map((product) => (
              <TableRow 
                key={product.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={(e) => {
                  // Don't trigger if clicking on buttons or links
                  if ((e.target as HTMLElement).closest('button, a')) return
                  window.location.href = `/${workspaceId}/products/${product.id}`
                }}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{product.name}</span>
                    {product.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {product.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {product.value_ladder_level && (
                    <Badge variant="outline" className={LEVEL_COLORS[product.value_ladder_level]}>
                      {product.value_ladder_level}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {product.type && (
                    <Badge variant="outline" className={TYPE_COLORS[product.type]}>
                      {product.type}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {product.product_benefits?.[0]?.count || 0}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {product.product_offers?.[0]?.count || 0}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {product.product_objections?.[0]?.count || 0}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {product.product_refusal_reasons?.[0]?.count || 0}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    {product.product_sales_scripts?.[0]?.count > 0 ? (
                      <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center rounded-full">
                        {product.product_sales_scripts[0].count}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    {product.sales_page_url && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a href={product.sales_page_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-600">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>Página de Vendas</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {product.checkout_url && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a href={product.checkout_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-green-600">
                              <ShoppingCart className="w-4 h-4" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>Checkout</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {formatPrice(product.standard_price)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/${workspaceId}/products/${product.id}`} className="cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
  )
}
