import type { ReactNode } from 'react'
import { NotificationProvider } from './NotificationProvider'
import { QueryProvider } from './QueryProvider'
import { ThemeProvider } from './ThemeProvider'
import { AppStoreProvider } from '../../store/appStore'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppStoreProvider>
      <ThemeProvider>
        <QueryProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </QueryProvider>
      </ThemeProvider>
    </AppStoreProvider>
  )
}
