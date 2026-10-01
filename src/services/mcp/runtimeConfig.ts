import { appConfig } from '../../app/config/app.config'

export type RuntimeConnectionSettings = { mode: 'demo' | 'api'; apiBaseUrl: string; apiToken: string }
const CONNECTION_KEY = 'mcpl-tools.connection'
const API_TOKEN_KEY = 'mcpl-tools.api-token'
export const MCP_PROVIDER_CHANGED_EVENT = 'mcpl-tools-provider-change'

const normalizeBaseUrl = (value: string): string => {
  const trimmed = value.trim().replace(/\/$/, '')
  if (!trimmed) return ''
  if (trimmed.startsWith('/')) return trimmed
  const url = new URL(trimmed)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('API base URL must use HTTP or HTTPS.')
  if (url.username || url.password || url.search || url.hash) throw new Error('API base URL must not contain credentials, query parameters, or fragments.')
  return url.toString().replace(/\/$/, '')
}

const readJson = <T>(reader: () => string | null, fallback: T): T => {
  try { const value = reader(); return value ? (JSON.parse(value) as T) : fallback } catch { return fallback }
}

export const getRuntimeConnectionSettings = (): RuntimeConnectionSettings => {
  const stored = readJson<{ mode?: 'demo' | 'api'; apiBaseUrl?: string }>(() => window.localStorage.getItem(CONNECTION_KEY), {})
  const token = (() => { try { return window.sessionStorage.getItem(API_TOKEN_KEY) ?? '' } catch { return '' } })()
  const buildApiUrl = appConfig.apiBaseUrl !== '/api' ? appConfig.apiBaseUrl : ''
  const apiBaseUrl = (() => { try { return normalizeBaseUrl(stored.apiBaseUrl ?? buildApiUrl) } catch { return buildApiUrl } })()
  const buildMode = appConfig.mcpProvider === 'api' && Boolean(buildApiUrl) ? 'api' : 'demo'
  return { mode: stored.mode ?? buildMode, apiBaseUrl, apiToken: token }
}

export const setRuntimeConnectionSettings = (settings: RuntimeConnectionSettings): void => {
  const apiBaseUrl = normalizeBaseUrl(settings.apiBaseUrl)
  if (settings.mode === 'api' && !apiBaseUrl) throw new Error('An API base URL is required for API mode.')
  try { window.localStorage.setItem(CONNECTION_KEY, JSON.stringify({ mode: settings.mode, apiBaseUrl })) } catch { throw new Error('Unable to save connection settings in this browser.') }
  try {
    if (settings.apiToken.trim()) window.sessionStorage.setItem(API_TOKEN_KEY, settings.apiToken.trim())
    else window.sessionStorage.removeItem(API_TOKEN_KEY)
  } catch { throw new Error('Unable to save the API token for this browser session.') }
  window.dispatchEvent(new Event(MCP_PROVIDER_CHANGED_EVENT))
}

export const clearRuntimeConnectionSettings = (): void => {
  try { window.localStorage.removeItem(CONNECTION_KEY) } catch { /* ignore */ }
  try { window.sessionStorage.removeItem(API_TOKEN_KEY) } catch { /* ignore */ }
  window.dispatchEvent(new Event(MCP_PROVIDER_CHANGED_EVENT))
}