import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { STORAGE_KEYS } from '../app/config/constants'
import { readStorage, writeStorage } from '../services/storage/localStorage'

export type AppPreferences = {
  autoRefresh: boolean
  compactMode: boolean
}

export type AppStore = {
  preferences: AppPreferences
  isHydrated: boolean
  updatePreferences: (patch: Partial<AppPreferences>) => void
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = { autoRefresh: true, compactMode: false }

const defaultStore: AppStore = {
  preferences: DEFAULT_APP_PREFERENCES,
  isHydrated: false,
  updatePreferences: () => undefined,
}

const AppStoreContext = createContext<AppStore>(defaultStore)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(() => readStorage(STORAGE_KEYS.appSettings, DEFAULT_APP_PREFERENCES))
  const isHydrated = true

  useEffect(() => {
    if (isHydrated) writeStorage(STORAGE_KEYS.appSettings, preferences)
    document.documentElement.dataset.density = preferences.compactMode ? 'compact' : 'comfortable'
  }, [preferences, isHydrated])

  const value = useMemo<AppStore>(() => ({
    preferences,
    isHydrated,
    updatePreferences: (patch) => setPreferences((current) => ({ ...current, ...patch })),
  }), [preferences, isHydrated])

  return createElement(AppStoreContext.Provider, { value }, children)
}

export function useAppStore() {
  return useContext(AppStoreContext)
}
