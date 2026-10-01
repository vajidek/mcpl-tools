import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'

const integrations = [
  { id: 'github', name: 'GitHub', status: 'Not connected', description: 'Repository, source-control, and automation workflows can be connected through your deployment environment.' },
  { id: 'slack', name: 'Slack', status: 'Not connected', description: 'Notification and team workflow integration is available as a future connector surface.' },
  { id: 'openai', name: 'OpenAI', status: 'Not connected', description: 'AI-assisted orchestration can be configured separately from MCP server connectivity.' },
]

export function IntegrationsPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Integrations</p>
          <h2>Integration registry</h2>
        </div>
      </header>

      <Card className="panel">
        <p className="tool-description">
          This registry describes supported integration surfaces. It does not claim that an external account or credential is currently connected.
          MCP server connectivity is managed from the Servers workspace.
        </p>
      </Card>

      <section className="tool-grid">
        {integrations.map((integration) => (
          <Card key={integration.id} className="tool-card">
            <div className="tool-card-header">
              <div>
                <p className="eyebrow">Integration</p>
                <h3>{integration.name}</h3>
              </div>
              <Badge tone="info">{integration.status}</Badge>
            </div>
            <p className="tool-description">{integration.description}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
