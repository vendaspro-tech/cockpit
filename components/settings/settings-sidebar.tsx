"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  User,
  Settings as SettingsIcon,
  Puzzle,
  Users,
  CreditCard,
  Target
} from "lucide-react"

const sidebarNavItems = [
  {
    title: "Minha Conta",
    href: "?tab=account",
    icon: User,
    type: 'tab' as const,
  },
  {
    title: "Workspace",
    href: "?tab=workspace",
    icon: SettingsIcon,
    type: 'tab' as const,
  },
  {
    title: "Integrações",
    href: "?tab=integrations",
    icon: Puzzle,
    type: 'tab' as const,
  },
  {
    title: "Usuários",
    href: "?tab=users",
    icon: Users,
    type: 'tab' as const,
  },
  {
    title: "Planos",
    href: "?tab=plans",
    icon: Target,
    type: 'tab' as const,
  },
   {
    title: "Faturamento",
    href: "?tab=billing",
    icon: CreditCard,
    type: 'tab' as const,
  },
]

type SettingsSidebarProps = HTMLAttributes<HTMLElement>

export function SettingsSidebar({ className, ...props }: SettingsSidebarProps) {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {sidebarNavItems.map((item) => {
        // Extract the tab value from the href (e.g., "?tab=users" -> "users")
        const itemTab = item.href.split('=')[1]
        const isActive = currentTab === itemTab || (!currentTab && itemTab === 'account')

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              isActive
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline",
              "justify-start"
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
