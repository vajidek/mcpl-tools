export function InsightsPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Analysis</p>
          <h2>Insights</h2>
        </div>
      </header>

      <section className="panel insight-panel">
        <div className="panel-header">
          <h3>Trend summary</h3>
        </div>

        <div className="insight-grid">
          <div>
            <p className="metric-label">Delivery momentum</p>
            <strong>+24%</strong>
          </div>
          <div>
            <p className="metric-label">Team efficiency</p>
            <strong>82/100</strong>
          </div>
          <div>
            <p className="metric-label">Issue backlog</p>
            <strong>12 items</strong>
          </div>
        </div>
      </section>
    </div>
  )
}
