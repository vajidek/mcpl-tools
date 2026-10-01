import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { serverStore } from '../../store/serverStore'
import { toolStore } from '../../store/toolStore'
import { mcpServiceProvider } from '../../services/mcp/MCPServiceProvider'
import { MCP_PROVIDER_CHANGED_EVENT } from '../../services/mcp/runtimeConfig'
import type { ProviderHealth } from '../../services/mcp/MCPServiceProvider.types'

export function Header() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [health, setHealth] = useState<ProviderHealth | null>(null)

  const refreshHealth = () => {
    void mcpServiceProvider.health().then(setHealth)
  }

  useEffect(() => {
    refreshHealth()
    window.addEventListener(MCP_PROVIDER_CHANGED_EVENT, refreshHealth)
    return () => window.removeEventListener(MCP_PROVIDER_CHANGED_EVENT, refreshHealth)
  }, [])

  const refresh = async () => {
    setIsRefreshing(true)
    try {
      const [, , status] = await Promise.all([serverStore.refresh(), toolStore.refresh(), mcpServiceProvider.health()])
      setHealth(status)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <header className="topbar">
      <div><p className="eyebrow">MCP operations workspace</p><h2>MCPL Tools</h2></div>
      <div className="inline-actions">
        {health ? <span className={'badge ' + (health.status === 'ok' ? 'badge-success' : 'badge-error')} title={health.message}>
          {health.mode === 'demo' ? 'Demo provider' : health.status === 'ok' ? 'API reachable' : 'API unavailable'}
        </span> : null}
        <Button type="button" variant="secondary" onClick={() => void refresh()} disabled={isRefreshing}>{isRefreshing ? 'Refreshing…' : 'Refresh'}</Button>
      </div>
    </header>
  )
}