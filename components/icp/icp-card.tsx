'use client'

/* eslint-disable @next/next/no-img-element */

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Target, 
  AlertTriangle, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Users
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import type { IcpWithProducts } from '@/lib/types/icp'

interface ICPCardProps {
  icp: IcpWithProducts
  workspaceId: string
  onDelete: (id: string) => void
}

export function ICPCard({ icp, workspaceId, onDelete }: ICPCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video w-full bg-muted relative">
        {icp.image_url ? (
          <img 
            src={icp.image_url} 
            alt={icp.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <Users className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/${workspaceId}/products/icp/${icp.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={() => onDelete(icp.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg leading-tight">{icp.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{icp.profession}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 space-y-3">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {icp.location && (
            <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
              <MapPin className="w-3 h-3" />
              {icp.location}
            </div>
          )}
          {icp.age_range && (
            <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
              <Users className="w-3 h-3" />
              {icp.age_range}
            </div>
          )}
        </div>

        {icp.main_pain && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertTriangle className="w-3 h-3" />
              Principal Dor
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {icp.main_pain}
            </p>
          </div>
        )}

        {icp.main_goal && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs font-medium text-green-600">
              <Target className="w-3 h-3" />
              Principal Objetivo
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {icp.main_goal}
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <div className="flex flex-wrap gap-1">
          {icp.icp_products?.map((p) => (
            <Badge key={p.product_id} variant="outline" className="text-[10px]">
              Produto Vinculado
            </Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  )
}
