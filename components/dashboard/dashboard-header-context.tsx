"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

type DashboardHeaderState = {
  title?: string
  hideBreadcrumb?: boolean
}

type DashboardHeaderContextValue = {
  state: DashboardHeaderState
  setState: (state: DashboardHeaderState) => void
  reset: () => void
}

const DashboardHeaderContext = createContext<DashboardHeaderContextValue | null>(null)

export function DashboardHeaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardHeaderState>({})

  const setHeaderState = useCallback((nextState: DashboardHeaderState) => {
    setState((prev) => {
      if (
        prev.title === nextState.title &&
        prev.hideBreadcrumb === nextState.hideBreadcrumb
      ) {
        return prev
      }
      return nextState
    })
  }, [])

  const reset = useCallback(() => {
    setState((prev) => {
      if (!prev.title && prev.hideBreadcrumb === undefined) return prev
      return {}
    })
  }, [])

  const value = useMemo(
    () => ({
      state,
      setState: setHeaderState,
      reset,
    }),
    [state, setHeaderState, reset]
  )

  return <DashboardHeaderContext.Provider value={value}>{children}</DashboardHeaderContext.Provider>
}

export function useDashboardHeaderContext() {
  const context = useContext(DashboardHeaderContext)
  if (!context) {
    throw new Error("useDashboardHeaderContext must be used within DashboardHeaderProvider")
  }
  return context
}

export function DashboardHeaderConfig({ title, hideBreadcrumb = true }: DashboardHeaderState) {
  const { setState, reset } = useDashboardHeaderContext()

  useEffect(() => {
    setState({ title, hideBreadcrumb })
    return () => reset()
  }, [title, hideBreadcrumb, setState, reset])

  return null
}
