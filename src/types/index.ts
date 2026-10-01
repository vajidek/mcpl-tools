export type NavItem = {
  id: string
  label: string
  to: string
  description: string
  badge?: string
}

export type ToolStatus = 'ready' | 'beta' | 'experimental'

export type ToolDefinition = {
  id: string
  name: string
  category: string
  description: string
  status: ToolStatus
  version: string
  lastUpdated: string
  tags: string[]
}

export type AppMetric = {
  label: string
  value: string
  detail: string
  tone: 'positive' | 'neutral' | 'warning'
}

export type QuickAction = {
  title: string
  description: string
  action: string
}
