'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Pencil, Check, X, GripVertical, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Category, Question, QuestionType, MatrixStatement, ScaleDescriptor } from "@/lib/types/test-structure"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface StructureTabProps {
  categories: Category[]
  onCategoriesChange: (categories: Category[]) => void
}

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'single_choice', label: 'Escolha Única' },
  { value: 'multiple_choice', label: 'Múltipla Escolha' },
  { value: 'scale', label: 'Escala (1-5)' },
  { value: 'matrix_rating', label: 'Matriz de Classificação (DISC)' },
  { value: 'text', label: 'Texto Curto' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'number', label: 'Número' }
]

export function StructureTab({
  categories,
  onCategoriesChange
}: StructureTabProps) {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryDescription, setEditCategoryDescription] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const addCategory = () => {
    if (!newCategoryName.trim()) return

    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name: newCategoryName,
      description: newCategoryDescription || undefined,
      order: categories.length,
      questions: []
    }

    onCategoriesChange([...categories, newCategory])
    setNewCategoryName('')
    setNewCategoryDescription('')
  }

  const removeCategory = (categoryId: string) => {
    const newCategories = categories.filter(c => c.id !== categoryId)
    // Update order after removal
    const reorderedCategories = newCategories.map((cat, index) => ({
      ...cat,
      order: index
    }))
    onCategoriesChange(reorderedCategories)
  }

  const startEditCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setEditCategoryName(category.name)
    setEditCategoryDescription(category.description || '')
  }

  const saveEditCategory = (categoryId: string) => {
    onCategoriesChange(
      categories.map(c =>
        c.id === categoryId
          ? { ...c, name: editCategoryName, description: editCategoryDescription || undefined }
          : c
      )
    )
    setEditingCategoryId(null)
  }

  const cancelEditCategory = () => {
    setEditingCategoryId(null)
    setEditCategoryName('')
    setEditCategoryDescription('')
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex(cat => cat.id === active.id)
      const newIndex = categories.findIndex(cat => cat.id === over.id)

      const reorderedCategories = arrayMove(categories, oldIndex, newIndex).map((cat, index) => ({
        ...cat,
        order: index
      }))

      onCategoriesChange(reorderedCategories)
    }
  }

  const updateCategory = (categoryId: string, questions: Question[]) => {
    onCategoriesChange(
      categories.map(c =>
        c.id === categoryId ? { ...c, questions } : c
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Categorias e Questões</h3>
            <p className="text-sm text-muted-foreground">
              Organize as questões do teste em categorias temáticas (arraste para reordenar)
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'}
          </span>
        </div>

        {categories.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <Accordion type="single" collapsible className="w-full">
                {categories.map((category) => (
                  <SortableCategory
                    key={category.id}
                    category={category}
                    isEditing={editingCategoryId === category.id}
                    editName={editCategoryName}
                    editDescription={editCategoryDescription}
                    onEditNameChange={setEditCategoryName}
                    onEditDescriptionChange={setEditCategoryDescription}
                    onStartEdit={startEditCategory}
                    onSaveEdit={saveEditCategory}
                    onCancelEdit={cancelEditCategory}
                    onRemove={removeCategory}
                    onQuestionsChange={(questions) => updateCategory(category.id, questions)}
                  />
                ))}
              </Accordion>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 border border-dashed rounded-lg">
            <p className="text-muted-foreground text-sm">Nenhuma categoria adicionada</p>
          </div>
        )}

        <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
          <Label>Nova Categoria</Label>
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nome da categoria..."
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          />
          <Textarea
            value={newCategoryDescription}
            onChange={(e) => setNewCategoryDescription(e.target.value)}
            placeholder="Descrição (opcional)..."
            rows={2}
          />
          <Button
            onClick={addCategory}
            disabled={!newCategoryName.trim()}
            size="sm"
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Categoria
          </Button>
        </div>
      </div>
    </div>
  )
}

// Sortable Category Component
function SortableCategory({
  category,
  isEditing,
  editName,
  editDescription,
  onEditNameChange,
  onEditDescriptionChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
  onQuestionsChange
}: {
  category: Category
  isEditing: boolean
  editName: string
  editDescription: string
  onEditNameChange: (value: string) => void
  onEditDescriptionChange: (value: string) => void
  onStartEdit: (category: Category) => void
  onSaveEdit: (categoryId: string) => void
  onCancelEdit: () => void
  onRemove: (categoryId: string) => void
  onQuestionsChange: (questions: Question[]) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <AccordionItem
      key={category.id}
      value={category.id}
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'z-50' : ''}
    >
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-2 flex-1">
            <div
              className="cursor-grab active:cursor-grabbing touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>

            {isEditing ? (
              <div className="flex gap-2 items-center flex-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editName}
                  onChange={(e) => onEditNameChange(e.target.value)}
                  className="h-8"
                  autoFocus
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSaveEdit(category.id)}
                  onKeyDown={(e) => e.key === 'Enter' && onSaveEdit(category.id)}
                  className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={onCancelEdit}
                  onKeyDown={(e) => e.key === 'Enter' && onCancelEdit()}
                  className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <span className="font-medium">{category.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({category.questions.length} {category.questions.length === 1 ? 'questão' : 'questões'})
                </span>
              </div>
            )}
          </div>
          {!isEditing && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onStartEdit(category)}
                onKeyDown={(e) => e.key === 'Enter' && onStartEdit(category)}
                className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onRemove(category.id)}
                onKeyDown={(e) => e.key === 'Enter' && onRemove(category.id)}
                className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md hover:bg-accent hover:text-accent-foreground text-destructive cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </div>
            </div>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <CategoryQuestions
          category={category}
          onQuestionsChange={onQuestionsChange}
        />
      </AccordionContent>
    </AccordionItem>
  )
}

// Category Questions Component with Drag & Drop
function CategoryQuestions({
  category,
  onQuestionsChange
}: {
  category: Category
  onQuestionsChange: (questions: Question[]) => void
}) {
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('scale')
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editQuestionText, setEditQuestionText] = useState('')
  const [editQuestionType, setEditQuestionType] = useState<QuestionType>('scale')
  const [editQuestionRequired, setEditQuestionRequired] = useState(true)
  const [editQuestionOptions, setEditQuestionOptions] = useState<Array<{id: string, label: string, value: number, order: number}>>([])
  const [editScaleDescriptors, setEditScaleDescriptors] = useState<Array<{value: number, label: string, description?: string}>>([])
  const [editMatrixStatements, setEditMatrixStatements] = useState<MatrixStatement[]>([])
  const [editMatrixScale, setEditMatrixScale] = useState<{min: number, max: number, descriptors?: ScaleDescriptor[]}>({ min: 1, max: 4 })
  const [editMatrixUniqueValues, setEditMatrixUniqueValues] = useState(true)
  const [expandedOptions, setExpandedOptions] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return

    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: newQuestionText,
      type: newQuestionType,
      order: category.questions.length,
      required: true,
      options: newQuestionType === 'single_choice' || newQuestionType === 'multiple_choice'
        ? [
            { id: 'opt_1', label: 'Opção 1', value: 1, order: 0 },
            { id: 'opt_2', label: 'Opção 2', value: 2, order: 1 },
            { id: 'opt_3', label: 'Opção 3', value: 3, order: 2 }
          ]
        : undefined
    }

    onQuestionsChange([...category.questions, newQuestion])
    setNewQuestionText('')
    setNewQuestionType('scale')
  }

  const handleRemoveQuestion = (questionId: string) => {
    const newQuestions = category.questions.filter(q => q.id !== questionId)
    // Update order after removal
    const reorderedQuestions = newQuestions.map((q, index) => ({
      ...q,
      order: index
    }))
    onQuestionsChange(reorderedQuestions)
  }

  const handleUpdateQuestion = (questionId: string, updates: Partial<Question>) => {
    onQuestionsChange(
      category.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    )
  }

  const startEditQuestion = (question: Question) => {
    setEditingQuestionId(question.id)
    setEditQuestionText(question.text)
    setEditQuestionType(question.type)
    setEditQuestionRequired(question.required ?? true)
    setEditQuestionOptions((question.options || []) as any)
    setEditScaleDescriptors(question.scale_descriptors || [])

    // Load matrix config if exists
    if (question.matrix_config) {
      setEditMatrixStatements(question.matrix_config.statements)
      setEditMatrixScale(question.matrix_config.scale)
      setEditMatrixUniqueValues(question.matrix_config.validation?.unique_values ?? true)
    } else {
      setEditMatrixStatements([])
      setEditMatrixScale({ min: 1, max: 4 })
      setEditMatrixUniqueValues(true)
    }

    setExpandedOptions(false)
  }

  const saveEditQuestion = (questionId: string) => {
    const updates: Partial<Question> = {
      text: editQuestionText,
      type: editQuestionType,
      required: editQuestionRequired
    }

    // For choice types, save the options
    if ((editQuestionType === 'single_choice' || editQuestionType === 'multiple_choice')) {
      updates.options = editQuestionOptions.length > 0
        ? editQuestionOptions
        : [
            { id: 'opt_1', label: 'Opção 1', value: 1, order: 0 },
            { id: 'opt_2', label: 'Opção 2', value: 2, order: 1 },
            { id: 'opt_3', label: 'Opção 3', value: 3, order: 2 }
          ]
      updates.scale_descriptors = undefined
      updates.matrix_config = undefined
    } else if (editQuestionType === 'scale') {
      // For scale type, save the scale descriptors
      updates.scale_descriptors = editScaleDescriptors.length > 0 ? editScaleDescriptors : undefined
      updates.options = undefined
      updates.matrix_config = undefined
    } else if (editQuestionType === 'matrix_rating') {
      // For matrix_rating type, save the matrix config
      updates.matrix_config = {
        statements: editMatrixStatements.length > 0
          ? editMatrixStatements
          : [
              { id: 'stmt_1', label: 'D', text: 'Afirmação D', order: 0 },
              { id: 'stmt_2', label: 'I', text: 'Afirmação I', order: 1 },
              { id: 'stmt_3', label: 'S', text: 'Afirmação S', order: 2 },
              { id: 'stmt_4', label: 'C', text: 'Afirmação C', order: 3 }
            ],
        scale: editMatrixScale,
        validation: { unique_values: editMatrixUniqueValues }
      }
      updates.options = undefined
      updates.scale_descriptors = undefined
    } else {
      // Remove all for other types
      updates.options = undefined
      updates.scale_descriptors = undefined
      updates.matrix_config = undefined
    }

    handleUpdateQuestion(questionId, updates)
    setEditingQuestionId(null)
  }

  // Option management functions
  const handleAddOption = () => {
    const newOption = {
      id: `opt_${Date.now()}`,
      label: `Opção ${editQuestionOptions.length + 1}`,
      value: editQuestionOptions.length + 1,
      order: editQuestionOptions.length
    }
    setEditQuestionOptions([...editQuestionOptions, newOption])
  }

  const handleUpdateOption = (optionId: string, label: string) => {
    setEditQuestionOptions(
      editQuestionOptions.map(opt =>
        opt.id === optionId ? { ...opt, label } : opt
      )
    )
  }

  const handleRemoveOption = (optionId: string) => {
    const newOptions = editQuestionOptions
      .filter(opt => opt.id !== optionId)
      .map((opt, idx) => ({ ...opt, order: idx, value: idx + 1 }))
    setEditQuestionOptions(newOptions)
  }

  // Scale descriptor management functions
  const handleAddScaleDescriptor = () => {
    const nextValue = editScaleDescriptors.length > 0
      ? Math.max(...editScaleDescriptors.map(d => d.value)) + 1
      : 1
    const newDescriptor = {
      value: nextValue,
      label: `Nível ${nextValue}`,
      description: ''
    }
    setEditScaleDescriptors([...editScaleDescriptors, newDescriptor].sort((a, b) => a.value - b.value))
  }

  const handleUpdateScaleDescriptor = (value: number, field: 'label' | 'description', newValue: string) => {
    setEditScaleDescriptors(
      editScaleDescriptors.map(desc =>
        desc.value === value ? { ...desc, [field]: newValue } : desc
      )
    )
  }

  const handleRemoveScaleDescriptor = (value: number) => {
    setEditScaleDescriptors(editScaleDescriptors.filter(desc => desc.value !== value))
  }

  // Matrix statement management functions
  const handleAddMatrixStatement = () => {
    const newStatement: MatrixStatement = {
      id: `stmt_${Date.now()}`,
      label: `Label ${editMatrixStatements.length + 1}`,
      text: `Afirmação ${editMatrixStatements.length + 1}`,
      order: editMatrixStatements.length
    }
    setEditMatrixStatements([...editMatrixStatements, newStatement])
  }

  const handleUpdateMatrixStatement = (statementId: string, field: 'label' | 'text', value: string) => {
    setEditMatrixStatements(
      editMatrixStatements.map(stmt =>
        stmt.id === statementId ? { ...stmt, [field]: value } : stmt
      )
    )
  }

  const handleRemoveMatrixStatement = (statementId: string) => {
    const newStatements = editMatrixStatements
      .filter(stmt => stmt.id !== statementId)
      .map((stmt, idx) => ({ ...stmt, order: idx }))
    setEditMatrixStatements(newStatements)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = category.questions.findIndex(q => q.id === active.id)
      const newIndex = category.questions.findIndex(q => q.id === over.id)

      const reorderedQuestions = arrayMove(category.questions, oldIndex, newIndex).map((q, index) => ({
        ...q,
        order: index
      }))

      onQuestionsChange(reorderedQuestions)
    }
  }

  return (
    <div className="space-y-4 pl-4 pt-2">
      {category.questions.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={category.questions.map(q => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {category.questions.map((question, qIndex) => (
                <SortableQuestion
                  key={question.id}
                  question={question}
                  index={qIndex}
                  isEditing={editingQuestionId === question.id}
                  editText={editQuestionText}
                  editType={editQuestionType}
                  editRequired={editQuestionRequired}
                  editOptions={editQuestionOptions}
                  editScaleDescriptors={editScaleDescriptors}
                  editMatrixStatements={editMatrixStatements}
                  editMatrixScale={editMatrixScale}
                  editMatrixUniqueValues={editMatrixUniqueValues}
                  expandedOptions={expandedOptions}
                  onEditTextChange={setEditQuestionText}
                  onEditTypeChange={setEditQuestionType}
                  onEditRequiredChange={setEditQuestionRequired}
                  onExpandedOptionsChange={setExpandedOptions}
                  onAddOption={handleAddOption}
                  onUpdateOption={handleUpdateOption}
                  onRemoveOption={handleRemoveOption}
                  onAddScaleDescriptor={handleAddScaleDescriptor}
                  onUpdateScaleDescriptor={handleUpdateScaleDescriptor}
                  onRemoveScaleDescriptor={handleRemoveScaleDescriptor}
                  onAddMatrixStatement={handleAddMatrixStatement}
                  onUpdateMatrixStatement={handleUpdateMatrixStatement}
                  onRemoveMatrixStatement={handleRemoveMatrixStatement}
                  onMatrixScaleChange={setEditMatrixScale}
                  onMatrixUniqueValuesChange={setEditMatrixUniqueValues}
                  onStartEdit={startEditQuestion}
                  onSaveEdit={saveEditQuestion}
                  onCancelEdit={() => setEditingQuestionId(null)}
                  onRemove={handleRemoveQuestion}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="text-sm text-muted-foreground italic">Nenhuma questão adicionada</p>
      )}

      <div className="border rounded-lg p-3 space-y-3 bg-muted/10">
        <Label className="text-sm font-medium">Nova Questão</Label>
        <div className="space-y-2">
          <Label htmlFor="new-question-text" className="text-xs text-muted-foreground">
            Texto da Questão
          </Label>
          <Input
            id="new-question-text"
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            placeholder="Texto da questão..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-question-type" className="text-xs text-muted-foreground">
            Tipo de Resposta
          </Label>
          <Select
            value={newQuestionType}
            onValueChange={(value) => setNewQuestionType(value as QuestionType)}
          >
            <SelectTrigger id="new-question-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleAddQuestion}
          disabled={!newQuestionText.trim()}
          size="sm"
          variant="outline"
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Questão
        </Button>
      </div>
    </div>
  )
}

// Sortable Question Component
function SortableQuestion({
  question,
  index,
  isEditing,
  editText,
  editType,
  editRequired,
  editOptions,
  editScaleDescriptors,
  editMatrixStatements,
  editMatrixScale,
  editMatrixUniqueValues,
  expandedOptions,
  onEditTextChange,
  onEditTypeChange,
  onEditRequiredChange,
  onExpandedOptionsChange,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onAddScaleDescriptor,
  onUpdateScaleDescriptor,
  onRemoveScaleDescriptor,
  onAddMatrixStatement,
  onUpdateMatrixStatement,
  onRemoveMatrixStatement,
  onMatrixScaleChange,
  onMatrixUniqueValuesChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove
}: {
  question: Question
  index: number
  isEditing: boolean
  editText: string
  editType: QuestionType
  editRequired: boolean
  editOptions: Array<{id: string, label: string, value: number, order: number}>
  editScaleDescriptors: Array<{value: number, label: string, description?: string}>
  editMatrixStatements: MatrixStatement[]
  editMatrixScale: {min: number, max: number, descriptors?: ScaleDescriptor[]}
  editMatrixUniqueValues: boolean
  expandedOptions: boolean
  onEditTextChange: (value: string) => void
  onEditTypeChange: (value: QuestionType) => void
  onEditRequiredChange: (value: boolean) => void
  onExpandedOptionsChange: (value: boolean) => void
  onAddOption: () => void
  onUpdateOption: (optionId: string, label: string) => void
  onRemoveOption: (optionId: string) => void
  onAddScaleDescriptor: () => void
  onUpdateScaleDescriptor: (value: number, field: 'label' | 'description', newValue: string) => void
  onRemoveScaleDescriptor: (value: number) => void
  onAddMatrixStatement: () => void
  onUpdateMatrixStatement: (statementId: string, field: 'label' | 'text', value: string) => void
  onRemoveMatrixStatement: (statementId: string) => void
  onMatrixScaleChange: (scale: {min: number, max: number, descriptors?: ScaleDescriptor[]}) => void
  onMatrixUniqueValuesChange: (value: boolean) => void
  onStartEdit: (question: Question) => void
  onSaveEdit: (questionId: string) => void
  onCancelEdit: () => void
  onRemove: (questionId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 p-3 border rounded-lg bg-background ${isDragging ? 'z-50 shadow-lg' : ''}`}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none mt-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="text-xs text-muted-foreground mt-1 w-8">{index + 1}.</span>
      {isEditing ? (
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Texto da Questão</Label>
            <Input
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tipo de Resposta</Label>
            <Select
              value={editType}
              onValueChange={(value) => onEditTypeChange(value as QuestionType)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`required-${question.id}`}
              checked={editRequired}
              onCheckedChange={(checked) => onEditRequiredChange(checked === true)}
            />
            <Label
              htmlFor={`required-${question.id}`}
              className="text-sm font-normal cursor-pointer"
            >
              Questão obrigatória
            </Label>
          </div>

          {(editType === 'single_choice' || editType === 'multiple_choice') && (
            <Collapsible open={expandedOptions} onOpenChange={onExpandedOptionsChange}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Opções de Resposta ({editOptions.length})</span>
                  {expandedOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {editOptions.map((option, idx) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-6">{idx + 1}.</span>
                    <Input
                      value={option.label}
                      onChange={(e) => onUpdateOption(option.id, e.target.value)}
                      className="h-8 flex-1"
                      placeholder={`Opção ${idx + 1}`}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveOption(option.id)}
                      className="h-8 w-8 p-0 text-destructive"
                      disabled={editOptions.length <= 2}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAddOption}
                  className="w-full"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Adicionar Opção
                </Button>
              </CollapsibleContent>
            </Collapsible>
          )}

          {editType === 'scale' && (
            <Collapsible open={expandedOptions} onOpenChange={onExpandedOptionsChange}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Descrições da Escala ({editScaleDescriptors.length})</span>
                  {expandedOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                {editScaleDescriptors.length > 0 ? (
                  editScaleDescriptors.map((descriptor) => (
                    <div key={descriptor.value} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="font-mono">
                          {descriptor.value}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveScaleDescriptor(descriptor.value)}
                          className="h-6 w-6 p-0 text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        value={descriptor.label}
                        onChange={(e) => onUpdateScaleDescriptor(descriptor.value, 'label', e.target.value)}
                        className="h-8"
                        placeholder="Nome do nível (ex: Insatisfatório)"
                      />
                      <Textarea
                        value={descriptor.description || ''}
                        onChange={(e) => onUpdateScaleDescriptor(descriptor.value, 'description', e.target.value)}
                        className="min-h-[60px] resize-none"
                        placeholder="Descrição detalhada do que este nível significa..."
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-2">
                    Nenhuma descrição adicionada
                  </p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAddScaleDescriptor}
                  className="w-full"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Adicionar Nível
                </Button>
              </CollapsibleContent>
            </Collapsible>
          )}

          {editType === 'matrix_rating' && (
            <Collapsible open={expandedOptions} onOpenChange={onExpandedOptionsChange}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Configuração da Matriz ({editMatrixStatements.length} afirmações)</span>
                  {expandedOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                  <Label className="text-sm font-medium">Escala de Avaliação</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="matrix-scale-min" className="text-xs text-muted-foreground">
                        Valor Mínimo
                      </Label>
                      <Input
                        id="matrix-scale-min"
                        type="number"
                        value={editMatrixScale.min}
                        onChange={(e) => onMatrixScaleChange({ ...editMatrixScale, min: parseInt(e.target.value) || 1 })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="matrix-scale-max" className="text-xs text-muted-foreground">
                        Valor Máximo
                      </Label>
                      <Input
                        id="matrix-scale-max"
                        type="number"
                        value={editMatrixScale.max}
                        onChange={(e) => onMatrixScaleChange({ ...editMatrixScale, max: parseInt(e.target.value) || 4 })}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="matrix-unique-values"
                      checked={editMatrixUniqueValues}
                      onCheckedChange={(checked) => onMatrixUniqueValuesChange(checked === true)}
                    />
                    <Label htmlFor="matrix-unique-values" className="text-xs font-normal cursor-pointer">
                      Exigir valores únicos (não repetir notas na mesma questão)
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Afirmações da Matriz</Label>
                  {editMatrixStatements.length > 0 ? (
                    editMatrixStatements.map((statement, idx) => (
                      <div key={statement.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            Afirmação {idx + 1}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemoveMatrixStatement(statement.id)}
                            className="h-6 w-6 p-0 text-destructive"
                            disabled={editMatrixStatements.length <= 2}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`stmt-label-${statement.id}`} className="text-xs text-muted-foreground">
                              Rótulo (opcional)
                            </Label>
                            <span className="text-xs text-muted-foreground">
                              - Ex: A, B, C, D para ordenação visual
                            </span>
                          </div>
                          <Input
                            id={`stmt-label-${statement.id}`}
                            value={statement.label || ''}
                            onChange={(e) => onUpdateMatrixStatement(statement.id, 'label', e.target.value)}
                            className="h-8"
                            placeholder="Deixe vazio para não exibir rótulo"
                            maxLength={3}
                          />
                          <p className="text-[10px] text-muted-foreground">
                            ⚠️ Para DISC, deixe vazio para não viesar as respostas do usuário
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`stmt-text-${statement.id}`} className="text-xs text-muted-foreground">
                            Texto da Afirmação
                          </Label>
                          <Textarea
                            id={`stmt-text-${statement.id}`}
                            value={statement.text}
                            onChange={(e) => onUpdateMatrixStatement(statement.id, 'text', e.target.value)}
                            className="min-h-[60px] resize-none"
                            placeholder="Texto completo da afirmação..."
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-2">
                      Nenhuma afirmação adicionada
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onAddMatrixStatement}
                    className="w-full"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Adicionar Afirmação
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="flex gap-2 pt-1 border-t">
            <Button
              size="sm"
              variant="default"
              onClick={() => onSaveEdit(question.id)}
            >
              <Check className="h-3 w-3 mr-1" />
              Salvar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancelEdit}
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">{question.text}</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {QUESTION_TYPE_OPTIONS.find(opt => opt.value === question.type)?.label || question.type}
              </Badge>
              {question.required && (
                <Badge variant="outline" className="text-xs">
                  Obrigatória
                </Badge>
              )}
              {question.options && question.options.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {question.options.length} opções
                </span>
              )}
            </div>
            {question.options && question.options.length > 0 && (
              <div className="pl-3 border-l-2 border-muted space-y-2 mt-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Opções de resposta (visível para o usuário):
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {question.options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2 text-xs p-2 border rounded bg-muted/20">
                      <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                        {idx + 1}
                      </Badge>
                      <span className="flex-1">{opt.label}</span>
                      <span className="text-muted-foreground font-mono">valor: {opt.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {question.scale_descriptors && question.scale_descriptors.length > 0 && (
              <div className="pl-3 border-l-2 border-blue-200 dark:border-blue-800 space-y-2 mt-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Escala de avaliação:
                </p>
                {question.scale_descriptors.map((desc) => (
                  <div key={desc.value} className="p-2 border rounded-md bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {desc.value}
                      </Badge>
                      <span className="font-medium text-sm">{desc.label}</span>
                    </div>
                    {desc.description && (
                      <p className="text-muted-foreground text-xs mt-1 ml-1">{desc.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {question.matrix_config && (
              <div className="pl-3 border-l-2 border-purple-200 dark:border-purple-800 space-y-2 mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    Escala: {question.matrix_config.scale.min} - {question.matrix_config.scale.max}
                  </Badge>
                  {question.matrix_config.validation?.unique_values && (
                    <Badge variant="outline" className="text-xs">
                      Valores únicos
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {question.matrix_config.statements.length} afirmações
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {question.matrix_config.statements.map((stmt) => (
                    <div key={stmt.id} className="p-2 border rounded-md bg-muted/30">
                      {stmt.label ? (
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="font-mono text-xs shrink-0" title="Rótulo visível para o usuário">
                            {stmt.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            (será exibido antes do texto)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs shrink-0 text-muted-foreground">
                            (sem rótulo)
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            usuário verá apenas o texto
                          </span>
                        </div>
                      )}
                      <p className="text-xs">{stmt.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStartEdit(question)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(question.id)}
              className="h-8 w-8 p-0 text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
