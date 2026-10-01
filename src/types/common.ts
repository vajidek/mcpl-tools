export type ThemeMode = 'light' | 'dark'
export type AsyncStateStatus = 'idle' | 'loading' | 'success' | 'error'
export type Severity = 'info' | 'success' | 'warning' | 'error'

export type BaseEntity = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export type AppRuntimeError = {
  code: string
  message: string
  details?: string
  severity?: Severity
}
