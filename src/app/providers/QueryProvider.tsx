/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'

const QueryContext = createContext<{
  isReady: boolean
}>({ isReady: true })

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryContext.Provider value={{ isReady: true }}>{children}</QueryContext.Provider>
}

export const useQueryClient = () => useContext(QueryContext)
