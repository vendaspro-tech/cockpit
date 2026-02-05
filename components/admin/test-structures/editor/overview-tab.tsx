'use client'

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TestMetadata, TestType } from "@/lib/types/test-structure"

interface OverviewTabProps {
  testType: TestType | ''
  metadata: TestMetadata
  isEditing: boolean
  changelog: string
  onTestTypeChange: (testType: TestType) => void
  onMetadataChange: (metadata: TestMetadata) => void
  onChangelogChange: (changelog: string) => void
}

const TEST_TYPE_OPTIONS: { value: TestType; label: string; description: string }[] = [
  {
    value: 'disc',
    label: 'DISC',
    description: 'Avaliação de perfil comportamental'
  },
  {
    value: 'seniority_seller',
    label: 'Senioridade Vendedor',
    description: 'Avaliação de nível de senioridade para vendedores'
  },
  {
    value: 'seniority_leader',
    label: 'Senioridade Líder',
    description: 'Avaliação de nível de senioridade para líderes'
  },
  {
    value: 'leadership_style',
    label: 'Estilo de Liderança',
    description: 'Identificação do estilo de liderança'
  },
  {
    value: 'def_method',
    label: 'Método DEF',
    description: 'Avaliação pelo método Desempenho, Esforço e Foco'
  },
  {
    value: 'values_8d',
    label: '8 Dimensões de Valores',
    description: 'Avaliação de valores pessoais em 8 dimensões'
  }
]

export function OverviewTab({
  testType,
  metadata,
  isEditing,
  changelog,
  onTestTypeChange,
  onMetadataChange,
  onChangelogChange
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-type">Tipo de Teste *</Label>
          {isEditing ? (
            <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
              {TEST_TYPE_OPTIONS.find(opt => opt.value === testType)?.label || 'N/A'}
            </div>
          ) : (
            <Select
              value={testType}
              onValueChange={(value) => onTestTypeChange(value as TestType)}
            >
              <SelectTrigger id="test-type">
                <SelectValue placeholder="Selecione o tipo de teste" />
              </SelectTrigger>
              <SelectContent>
                {TEST_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">
            {isEditing
              ? 'O tipo de teste não pode ser alterado após a criação'
              : 'Selecione o tipo de teste que esta estrutura irá configurar'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            value={metadata?.name || ''}
            onChange={(e) => onMetadataChange({ ...metadata, name: e.target.value })}
            placeholder="Ex: Avaliação DISC Padrão"
          />
          <p className="text-xs text-muted-foreground">
            Nome descritivo para esta estrutura de teste
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição *</Label>
          <Textarea
            id="description"
            value={metadata?.description || ''}
            onChange={(e) => onMetadataChange({ ...metadata, description: e.target.value })}
            placeholder="Descreva o objetivo e escopo desta avaliação..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Descrição detalhada sobre o que este teste avalia
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Instruções</Label>
          <Textarea
            id="instructions"
            value={metadata?.instructions || ''}
            onChange={(e) => onMetadataChange({ ...metadata, instructions: e.target.value })}
            placeholder="Instruções para o avaliado sobre como responder o teste..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Instruções que serão exibidas ao avaliado antes de iniciar o teste
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duração Estimada (minutos)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            value={metadata?.estimated_duration_minutes || ''}
            onChange={(e) =>
              onMetadataChange({
                ...metadata,
                estimated_duration_minutes: e.target.value ? parseInt(e.target.value) : undefined
              })
            }
            placeholder="15"
          />
          <p className="text-xs text-muted-foreground">
            Tempo estimado para conclusão do teste
          </p>
        </div>

        {isEditing && (
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="changelog">Changelog *</Label>
            <Textarea
              id="changelog"
              value={changelog}
              onChange={(e) => onChangelogChange(e.target.value)}
              placeholder="Descreva as alterações realizadas nesta versão..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Descreva as mudanças feitas em relação à versão anterior
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
