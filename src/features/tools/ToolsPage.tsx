import { toolCatalog } from '../../services/toolRegistry'
import { formatDate } from '../../utils/formatters'

export function ToolsPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Catalog</p>
          <h2>Available tools</h2>
        </div>
      </header>

      <section className="tool-grid">
        {toolCatalog.map((tool) => (
          <article key={tool.id} className="tool-card">
            <div className="tool-card-header">
              <div>
                <p className="eyebrow">{tool.category}</p>
                <h3>{tool.name}</h3>
              </div>
              <span className={`tool-status tool-status-${tool.status}`}>{tool.status}</span>
            </div>

            <p className="tool-description">{tool.description}</p>

            <div className="tag-list">
              {tool.tags.map((tag) => (
                <span key={tag} className="tag-pill">
                  {tag}
                </span>
              ))}
            </div>

            <div className="tool-meta">
              <span>v{tool.version}</span>
              <span>{formatDate(tool.lastUpdated)}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
