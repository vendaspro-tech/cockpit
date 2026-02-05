'use client'

import { NovelEditor } from './novel-editor'

interface RichTextEditorProps {
  content: any
  onChange: (content: string) => void
  editable?: boolean
}

// Legacy wrapper kept for compatibility; delegates to the Novel editor.
export function RichTextEditor({ content, onChange, editable = true }: RichTextEditorProps) {
  return <NovelEditor content={content} onChange={onChange} editable={editable} />
}
