'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MatrixRatingConfig } from '@/lib/types/test-structure'

interface MatrixRatingQuestionProps {
  questionId: string
  questionText: string
  matrixConfig: MatrixRatingConfig
  initialValues?: Record<string, number>
  onChange: (statementId: string, value: number) => void
  disabled?: boolean
}

export function MatrixRatingQuestion({
  questionId,
  questionText,
  matrixConfig,
  initialValues = {},
  onChange,
  disabled = false
}: MatrixRatingQuestionProps) {
  const [values, setValues] = useState<Record<string, number>>(initialValues)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Validate unique values constraint
  useEffect(() => {
    if (matrixConfig.validation?.unique_values) {
      const valuesList = Object.values(values)
      const uniqueValues = new Set(valuesList)

      if (valuesList.length > 0 && valuesList.length === matrixConfig.statements.length) {
        if (uniqueValues.size !== valuesList.length) {
          setValidationError('Você deve usar cada valor apenas uma vez. Não repita notas.')
        } else {
          setValidationError(null)
        }
      } else {
        setValidationError(null)
      }
    }
  }, [values, matrixConfig.validation?.unique_values, matrixConfig.statements.length])

  const handleChange = (statementId: string, newValue: number) => {
    const updatedValues = { ...values, [statementId]: newValue }
    setValues(updatedValues)
    onChange(statementId, newValue)
  }

  const getValueColor = (statementId: string, value: number) => {
    if (!matrixConfig.validation?.unique_values) return 'default'

    const allValues = Object.entries(values)
      .filter(([id]) => id !== statementId)
      .map(([, val]) => val)

    return allValues.includes(value) ? 'destructive' : 'default'
  }

  return (
    <div className="space-y-4">
      {/* Matrix header with scale info */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="text-xs">
          Escala: {matrixConfig.scale.min} - {matrixConfig.scale.max}
        </Badge>
        {matrixConfig.validation?.unique_values && (
          <Badge variant="outline" className="text-xs">
            Use cada valor apenas uma vez
          </Badge>
        )}
      </div>

      {/* Scale descriptors (if available) */}
      {matrixConfig.scale.descriptors && matrixConfig.scale.descriptors.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-muted/30 p-3 rounded-lg">
          {matrixConfig.scale.descriptors.map((desc) => (
            <div key={desc.value} className="flex flex-col">
              <Badge variant="outline" className="font-mono text-xs mb-1 w-fit">
                {desc.value}
              </Badge>
              <span className="text-muted-foreground">{desc.label}</span>
              {desc.description && (
                <span className="text-xs text-muted-foreground/70 mt-0.5">
                  {desc.description}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Matrix statements */}
      <div className="space-y-4 border rounded-lg p-4">
        {matrixConfig.statements.map((statement) => {
          const statementValue = values[statement.id] || Math.floor((matrixConfig.scale.min + matrixConfig.scale.max) / 2)
          const colorVariant = getValueColor(statement.id, statementValue)

          return (
            <div key={statement.id} className="space-y-3 pb-4 last:pb-0 border-b last:border-b-0">
              {/* Statement header */}
              <div className="flex items-start gap-3">
                <Badge
                  variant="secondary"
                  className="mt-1 font-mono text-xs shrink-0"
                >
                  {statement.label}
                </Badge>
                <p className="text-sm font-medium flex-1">{statement.text}</p>
              </div>

              {/* Slider */}
              <div className="pl-0 md:pl-8 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Valor atual:</span>
                  <Badge
                    variant={colorVariant === 'destructive' ? 'destructive' : 'default'}
                    className="font-mono"
                  >
                    {statementValue}
                  </Badge>
                </div>
                <Slider
                  value={[statementValue]}
                  onValueChange={(newValues) => handleChange(statement.id, newValues[0])}
                  min={matrixConfig.scale.min}
                  max={matrixConfig.scale.max}
                  step={1}
                  disabled={disabled}
                  className={cn(
                    "w-full",
                    colorVariant === 'destructive' && "accent-destructive"
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{matrixConfig.scale.min}</span>
                  <span>{matrixConfig.scale.max}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress indicator */}
      <div className="text-xs text-muted-foreground text-center">
        {Object.keys(values).length} de {matrixConfig.statements.length} afirmações avaliadas
      </div>
    </div>
  )
}
