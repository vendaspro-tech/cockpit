'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ExportPDFButtonProps {
  assessmentId: string
  fileName?: string
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
}

export function ExportPDFButton({
  assessmentId,
  fileName,
  variant = 'outline',
  className
}: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/export-pdf/${assessmentId}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Erro ao exportar PDF')
      }
      
      const blob = await response.blob()
      
      // Criar URL temporária para o blob
      const url = window.URL.createObjectURL(blob)
      
      // Criar link temporário e disparar download
      const a = document.createElement('a')
      a.href = url
      a.download = fileName || `avaliacao-${assessmentId}.pdf`
      document.body.appendChild(a)
      a.click()
      
      // Limpar
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('PDF exportado com sucesso!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar PDF')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant={variant}
      className={className}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </>
      )}
    </Button>
  )
}
