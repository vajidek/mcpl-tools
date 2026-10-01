import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ROUTE_PATHS } from '../../../app/config/constants'
import { useTheme } from '../../../app/providers/ThemeProvider'
import { executionStore } from '../../../store/executionStore'
import { serverStore } from '../../../store/serverStore'
import { toolStore } from '../../../store/toolStore'
import { useAppStore } from '../../../store/appStore'
import { mcpServiceProvider } from '../../../services/mcp/MCPServiceProvider'
import { getRuntimeConnectionSettings, setRuntimeConnectionSettings } from '../../../services/mcp/runtimeConfig'

const settings = [
  { label: 'General', description: 'Workspace defaults and preferences', path: ROUTE_PATHS.settingsGeneral },
  { label: 'Connection', description: 'Connect this browser to a real MCPL Tools API', path: ROUTE_PATHS.settingsConnection },
  { label: 'Security', description: 'Access boundaries and secret handling', path: ROUTE_PATHS.settingsSecurity },
  { label: 'Appearance', description: 'Theme and interface density', path: ROUTE_PATHS.settingsAppearance },
]

const detailBySection: Record<string, { title: string; description: string; values: Array<{ label: string; value: string }> }> = {
  [ROUTE_PATHS.settingsGeneral]: {
    title: 'General settings',
    description: 'Default workspace preferences for MCP operations and workspace workflows.',
    values: [{ label: 'Default server', value: 'Backend-managed' }, { label: 'Auto-refresh', value: 'Enabled' }, { label: 'Execution timeout', value: 'Configured per MCP server' }],
  },
  [ROUTE_PATHS.settingsConnection]: {
    title: 'API connection',
    description: 'Point the static workspace at your deployed Node gateway. The API token is kept in this browser session only.',
    values: [{ label: 'Provider', value: 'Automatic' }, { label: 'API endpoint', value: 'Configured below' }, { label: 'Authentication', value: 'Bearer token' }],
  },
  [ROUTE_PATHS.settingsSecurity]: {
    title: 'Security settings',
    description: 'Protect credentials and keep the browser/backend execution boundary explicit.',
    values: [{ label: 'Credential storage', value: 'Backend only' }, { label: 'Input validation', value: 'Required' }, { label: 'Secret logging', value: 'Disabled' }],
  },
  [ROUTE_PATHS.settingsAppearance]: {
    title: 'Appearance settings',
    description: 'Control theme and interface density for developer-focused workflows.',
    values: [{ label: 'Theme', value: 'Dark' }, { label: 'Density', value: 'Comfortable' }, { label: 'Font scale', value: 'Default' }],
  },
}

export function SettingsPage() {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const { preferences, updatePreferences } = useAppStore()
  const runtime = getRuntimeConnectionSettings()
  const [apiBaseUrl, setApiBaseUrl] = useState(runtime.apiBaseUrl)
  const [apiToken, setApiToken] = useState(runtime.apiToken)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const activeSection = Object.entries(detailBySection).find(([path]) => location.pathname === path)?.[0] ?? ROUTE_PATHS.settingsGeneral
  const section = detailBySection[activeSection]
  const sectionValues = section.values.map((item) => {
    if (item.label === 'Default server') return { ...item, value: mcpServiceProvider.mode === 'demo' ? 'Demo catalog' : 'Backend-managed' }
    if (item.label === 'Provider') return { ...item, value: mcpServiceProvider.mode === 'demo' ? 'Demo provider' : 'API provider' }
    if (item.label === 'API endpoint') return { ...item, value: runtime.apiBaseUrl || 'Not configured' }
    if (item.label === 'Theme') return { ...item, value: theme === 'dark' ? 'Dark' : 'Light' }
    if (item.label === 'Density') return { ...item, value: preferences.compactMode ? 'Compact' : 'Comfortable' }
    if (item.label === 'Auto-refresh') return { ...item, value: preferences.autoRefresh ? 'Enabled' : 'Disabled' }
    return item
  })

  const refreshWorkspace = async () => {
    await Promise.allSettled([serverStore.refresh(), toolStore.refresh(), executionStore.refresh()])
  }

  const saveConnection = async () => {
    setFeedback('')
    setError('')
    try {
      setRuntimeConnectionSettings({ mode: 'api', apiBaseUrl, apiToken })
      await refreshWorkspace()
      const health = await mcpServiceProvider.health()
      if (health.status !== 'ok') throw new Error(health.message)
      setFeedback('API connection verified. The workspace is now using the backend provider.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to connect to the backend API.')
    }
  }

  const switchToDemoMode = async () => {
    setFeedback('')
    setError('')
    try {
      setRuntimeConnectionSettings({ mode: 'demo', apiBaseUrl, apiToken: '' })
      await refreshWorkspace()
      setApiToken('')
      setFeedback('Demo provider restored.')
    } catch (demoError) {
      setError(demoError instanceof Error ? demoError.message : 'Unable to switch to demo mode.')
    }
  }

  const clearHistory = async () => {
    if (!window.confirm('Clear all execution history? This cannot be undone.')) return
    const cleared = await executionStore.clear()
    if (!cleared) { setError(executionStore.getSnapshot().error ?? 'Unable to clear execution history.'); return }
    setFeedback('Execution history cleared.')
    setError('')
  }

  const clearLogs = async () => {
    if (!window.confirm('Clear all log entries?')) return
    try { await mcpServiceProvider.clearLogs(); setFeedback('Logs cleared.'); setError('') }
    catch (clearError) { setError(clearError instanceof Error ? clearError.message : 'Unable to clear logs.') }
  }

  const resetApplication = async () => {
    if (!window.confirm('Reset demo server state, execution history, logs, and saved preferences? This cannot be undone.')) return
    try {
      await mcpServiceProvider.resetDemoState()
      await executionStore.refresh()
      updatePreferences({ autoRefresh: true, compactMode: false })
      setTheme('dark')
      setFeedback('Demo state and saved preferences reset.')
      setError('')
    } catch (resetError) { setError(resetError instanceof Error ? resetError.message : 'Unable to reset local application state.') }
  }

  return (
    <div className="page-stack">
      <header className="page-header"><div><p className="eyebrow">Settings</p><h2>Workspace settings</h2></div></header>
      <section className="settings-shell">
        <div className="settings-tabs">{settings.map((setting) => <NavLink key={setting.label} to={setting.path} className={({ isActive }) => 'settings-tab ' + (isActive ? 'settings-tab-active' : '')}>{setting.label}</NavLink>)}</div>
        <Card className="panel settings-content">
          <div className="section-header"><h3>{section.title}</h3></div>
          <p className="tool-description">{section.description}</p>
          {feedback ? <div className="result-banner result-banner-success" role="status">{feedback}</div> : null}
          {error ? <div className="result-banner result-banner-error" role="alert">{error}</div> : null}

          {activeSection === ROUTE_PATHS.settingsConnection ? <div className="field-list">
            <label className="field-group"><span>Backend API URL</span><input className="text-input" type="url" value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} placeholder="https://mcpl-tools-api.onrender.com" /></label>
            <label className="field-group"><span>API access token</span><input className="text-input" type="password" value={apiToken} onChange={(event) => setApiToken(event.target.value)} placeholder="Paste your backend token" autoComplete="off" /></label>
            <div className="result-banner">The token is stored in session storage and sent only as a Bearer token. Never commit it to GitHub or put it in frontend source code.</div>
            <div className="inline-actions settings-actions"><Button type="button" onClick={() => void saveConnection()}>Save and verify API</Button><Button type="button" variant="secondary" onClick={() => void switchToDemoMode()}>Use demo mode</Button></div>
          </div> : null}

          {activeSection === ROUTE_PATHS.settingsAppearance ? <div className="field-list">
            <label className="field-group"><span>Theme preference</span><select className="text-input" value={theme} onChange={(event) => setTheme(event.target.value as 'light' | 'dark')}><option value="dark">Dark</option><option value="light">Light</option></select></label>
            <label className="setting-row"><span><strong>Compact density</strong><small>Reduce spacing in workspace surfaces.</small></span><input type="checkbox" checked={preferences.compactMode} onChange={(event) => updatePreferences({ compactMode: event.target.checked })} /></label>
          </div> : null}

          {activeSection === ROUTE_PATHS.settingsGeneral ? <div className="field-list">
            <label className="setting-row"><span><strong>Auto-refresh data</strong><small>Refresh catalogs when screens are opened.</small></span><input type="checkbox" checked={preferences.autoRefresh} onChange={(event) => updatePreferences({ autoRefresh: event.target.checked })} /></label>
            <div className="setting-row"><span><strong>Runtime mode</strong><small>{mcpServiceProvider.mode === 'demo' ? 'Local fixtures and simulated operations.' : 'Catalog and operations are routed through the configured backend API.'}</small></span><span className={'badge ' + (mcpServiceProvider.mode === 'demo' ? 'badge-warning' : 'badge-info')}>{mcpServiceProvider.mode === 'demo' ? 'Demo' : 'API'}</span></div>
          </div> : null}

          {activeSection === ROUTE_PATHS.settingsSecurity ? <div className="result-banner result-banner-success">{mcpServiceProvider.mode === 'demo' ? 'Demo mode keeps MCP operations local and does not contact external servers.' : 'API mode keeps MCP credentials and transport configuration on the backend; the browser receives neither server secrets nor MCP configuration.'}</div> : null}

          <div className="settings-list">{sectionValues.map((value) => <div key={value.label} className="setting-row"><div><strong>{value.label}</strong></div><span>{value.value}</span></div>)}</div>

          {activeSection === ROUTE_PATHS.settingsGeneral ? <div className="inline-actions settings-actions">
            <Button type="button" variant="secondary" onClick={() => void clearHistory()}>Clear execution history</Button>
            <Button type="button" variant="secondary" onClick={() => void clearLogs()}>Clear logs</Button>
            {mcpServiceProvider.mode === 'demo' ? <Button type="button" onClick={() => void resetApplication()}>Reset local app state</Button> : null}
          </div> : null}
        </Card>
      </section>
    </div>
  )
}
