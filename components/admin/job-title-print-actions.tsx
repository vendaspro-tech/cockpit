'use client'

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

export function JobTitlePrintActions() {
  const searchParams = useSearchParams()
  const autoPrint = searchParams.get('autoprint') === 'true'

  useEffect(() => {
    if (autoPrint) {
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        window.print()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [autoPrint])

  return (
    <div className="flex justify-end print:hidden">
      <Button variant="outline" onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        Imprimir / Exportar PDF
      </Button>
    </div>
  )
}
