/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type AppNotification = {
  id: string
  title: string
  message: string
  tone?: 'info' | 'success' | 'warning' | 'error'
}

const NotificationContext = createContext<{
  notifications: AppNotification[]
  push: (notification: Omit<AppNotification, 'id'>) => void
  dismiss: (id: string) => void
}>({
  notifications: [],
  push: () => undefined,
  dismiss: () => undefined,
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const push = (notification: Omit<AppNotification, 'id'>) => {
    const entry: AppNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    }

    setNotifications((previous) => [...previous, entry])
  }

  const dismiss = (id: string) => {
    setNotifications((previous) => previous.filter((item) => item.id !== id))
  }

  const value = useMemo(() => ({ notifications, push, dismiss }), [notifications])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotifications = () => useContext(NotificationContext)
