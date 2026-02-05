import { useEffect, useState, useCallback } from 'react'
import type { TestStructureDraft } from '@/lib/types/test-structure'

const DRAFT_KEY_PREFIX = 'test-structure-draft-'

export function useDraft(testStructureId?: string) {
  const [hasDraft, setHasDraft] = useState(false)
  const draftKey = testStructureId ? `${DRAFT_KEY_PREFIX}${testStructureId}` : `${DRAFT_KEY_PREFIX}new`

  // Check if draft exists
  useEffect(() => {
    if (typeof window === 'undefined') return

    const draft = localStorage.getItem(draftKey)
    setHasDraft(!!draft)
  }, [draftKey])

  // Save draft
  const saveDraft = useCallback((draft: Partial<TestStructureDraft>) => {
    if (typeof window === 'undefined') return

    const existingDraft = localStorage.getItem(draftKey)
    const existing = existingDraft ? JSON.parse(existingDraft) : {}

    const updated: TestStructureDraft = {
      ...existing,
      ...draft,
      last_saved_at: new Date().toISOString()
    }

    localStorage.setItem(draftKey, JSON.stringify(updated))
    setHasDraft(true)
  }, [draftKey])

  // Load draft
  const loadDraft = useCallback((): TestStructureDraft | null => {
    if (typeof window === 'undefined') return null

    const draft = localStorage.getItem(draftKey)
    if (!draft) return null

    try {
      return JSON.parse(draft)
    } catch {
      return null
    }
  }, [draftKey])

  // Clear draft
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return

    localStorage.removeItem(draftKey)
    setHasDraft(false)
  }, [draftKey])

  // Get all drafts
  const getAllDrafts = useCallback((): TestStructureDraft[] => {
    if (typeof window === 'undefined') return []

    const drafts: TestStructureDraft[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(DRAFT_KEY_PREFIX)) {
        const draft = localStorage.getItem(key)
        if (draft) {
          try {
            drafts.push(JSON.parse(draft))
          } catch {
            // Invalid draft, skip
          }
        }
      }
    }

    return drafts
  }, [])

  return {
    hasDraft,
    saveDraft,
    loadDraft,
    clearDraft,
    getAllDrafts
  }
}
