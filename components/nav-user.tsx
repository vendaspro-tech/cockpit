"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function NavUser() {
  const { isMobile } = useSidebar()
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const [user, setUser] = useState<{ email?: string | null; name?: string | null; avatar?: string | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        if (cancelled) return
        setUser({
          email: data.user.email,
          name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email,
          avatar: data.user.user_metadata?.avatar_url
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (!user) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:h-8 md:p-0">
            <Link href={`/${workspaceId}/settings`}>
                <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar || ""} alt={user.name || ""} />
                    <AvatarFallback className="rounded-lg">
                        {user.name?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
            </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
