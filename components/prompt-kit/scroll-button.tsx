"use client"

import { useEffect, useState } from "react"
import type { HTMLAttributes, RefObject } from "react"
import { ArrowDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ScrollButtonProps = HTMLAttributes<HTMLDivElement> & {
  containerRef: RefObject<HTMLDivElement | null>
}

export function ScrollButton({ className, containerRef, ...props }: ScrollButtonProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const onScroll = () => {
      const distanceToBottom = node.scrollHeight - node.scrollTop - node.clientHeight
      setVisible(distanceToBottom > 80)
    }

    onScroll()
    node.addEventListener("scroll", onScroll)
    return () => node.removeEventListener("scroll", onScroll)
  }, [containerRef])

  if (!visible) return null

  return (
    <div className={cn("absolute bottom-20 right-4", className)} {...props}>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="rounded-full shadow-sm"
        onClick={() => {
          containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" })
        }}
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
