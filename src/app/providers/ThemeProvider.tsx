/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { STORAGE_KEYS } from '../config/constants'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import type { ThemeMode } from '../../types/common'

const ThemeContext = createContext<{
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}>({
  theme: 'dark',
  setTheme: () => undefined,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<ThemeMode>(STORAGE_KEYS.theme, 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
