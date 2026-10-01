import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'

const integrations = [
  { id: 'github', name: 'GitHub', status: 'connected', description: 'Source control and repository events' },
  { id: 'slack', name: 'Slack', status: 'configured', description: 'Team notifications and workflow updates' },
  { id: 'openai', name: 'OpenAI', status: 'pending', description: 'Future AI-assisted tool orchestration' },
]

export function IntegrationsPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Integrations</p>
          <h2>Connected services</h2>
        </div>
      </header>

      <section className="tool-grid">
        {integrations.map((integration) => (
          <Card key={integration.id} className="tool-card">
            <div className="tool-card-header">
              <div>
                <p className="eyebrow">Integration</p>
                <h3>{integration.name}</h3>
              </div>
              <Badge tone={integration.status === 'connected' ? 'success' : integration.status === 'pending' ? 'warning' : 'info'}>
                {integration.status}
              </Badge>
            </div>
            <p className="tool-description">{integration.description}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
