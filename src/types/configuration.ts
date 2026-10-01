export type AppSettings = {
  theme: 'light' | 'dark'
  compactMode: boolean
  notificationsEnabled: boolean
  defaultWorkspace: string
}

export const defaultAppSettings: AppSettings = {
  theme: 'dark',
  compactMode: false,
  notificationsEnabled: true,
  defaultWorkspace: 'workspace-default',
}
