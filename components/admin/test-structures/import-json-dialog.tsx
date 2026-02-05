'use client'

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileJson } from "lucide-react"
import type { TestStructure } from "@/lib/types/test-structure"

interface ImportJsonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: Partial<TestStructure>) => void
}

export function ImportJsonDialog({
  open,
  onOpenChange,
  onImport
}: ImportJsonDialogProps) {
  const { toast } = useToast()
  const [jsonText, setJsonText] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setJsonText(text)
    }
    reader.readAsText(file)
  }

  const validateAndImport = () => {
    if (!jsonText.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Cole ou carregue um JSON válido"
      })
      return
    }

    setIsValidating(true)

    try {
      const parsed = JSON.parse(jsonText)

      // Basic validation
      if (!parsed.structure) {
        throw new Error('JSON deve conter um campo "structure"')
      }

      if (!parsed.structure.metadata) {
        throw new Error('Structure deve conter "metadata"')
      }

      if (!parsed.structure.categories || !Array.isArray(parsed.structure.categories)) {
        throw new Error('Structure deve conter "categories" (array)')
      }

      if (!parsed.structure.scoring) {
        throw new Error('Structure deve conter "scoring"')
      }

      // Import successful
      onImport(parsed)
      toast({
        title: "Importado com sucesso",
        description: "Estrutura de teste importada. Revise os dados antes de salvar."
      })
      onOpenChange(false)
      setJsonText('')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao importar JSON",
        description: error instanceof Error ? error.message : 'JSON inválido'
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handlePasteExample = () => {
    const example = {
      test_type: "disc",
      structure: {
        metadata: {
          name: "Exemplo de Teste",
          description: "Descrição do teste",
          instructions: "Instruções para o avaliado"
        },
        categories: [
          {
            id: "cat_1",
            name: "Categoria 1",
            order: 0,
            questions: [
              {
                id: "q_1",
                text: "Pergunta exemplo?",
                type: "scale",
                order: 0,
                required: true
              }
            ]
          }
        ],
        scoring: {
          method: "sum",
          scale: {
            min: 1,
            max: 5
          },
          ranges: []
        }
      }
    }

    setJsonText(JSON.stringify(example, null, 2))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Importar JSON
          </DialogTitle>
          <DialogDescription>
            Importe uma estrutura de teste a partir de um arquivo JSON
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="json-file">Carregar arquivo JSON</Label>
            <div className="flex gap-2">
              <input
                id="json-file"
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePasteExample}
              >
                Exemplo
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="json-text">Ou cole o JSON aqui</Label>
            <Textarea
              id="json-text"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{"test_type": "disc", "structure": {...}}'
              rows={15}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              O JSON deve conter os campos: test_type, structure (metadata, categories, scoring)
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={validateAndImport}
            disabled={!jsonText.trim() || isValidating}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isValidating ? 'Validando...' : 'Importar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
