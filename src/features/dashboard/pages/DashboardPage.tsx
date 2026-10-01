import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { ROUTE_PATHS } from '../../../app/config/constants'

const featuredTools = [
  { title: 'MTO Generator', text: 'Create a clean material take-off table for site and project work.', path: ROUTE_PATHS.mtoGenerator },
  { title: 'Pipe Weight', text: 'Calculate pipe kg/m and total weight.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'pipe-weight') },
  { title: 'Flow Velocity', text: 'Check velocity from pipeline flow and diameter.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'flow-velocity') },
  { title: 'Pipe Head Loss', text: 'Estimate friction head loss for a water pipeline.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'head-loss') },
  { title: 'Pump Power', text: 'Estimate pump power from flow, head and efficiency.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'pump-power') },
  { title: 'Excavation & Backfill', text: 'Estimate pipeline trench quantities.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'trench-volume') },
  { title: 'Steel Plate Weight', text: 'Calculate steel plate weight quickly.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'steel-plate-weight') },
  { title: 'Concrete Volume', text: 'Calculate concrete quantity from dimensions.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'concrete-volume') },
]

export function DashboardPage() {
  return (
    <div className="page-stack">
      <section className="welcome-hero">
        <div>
          <p className="eyebrow">MCPL Tools</p>
          <h2>Useful tools for engineering work.</h2>
          <p>Mechanical and piping first, with practical civil and estimation tools for project work.</p>
        </div>
        <Link to={ROUTE_PATHS.mtoGenerator} className="primary-button button-link">Open MTO Generator</Link>
      </section>

      <section className="section-block">
        <div className="section-header">
          <div>
            <h3>Quick tools</h3>
            <p className="tool-description">Open a calculator and get the result immediately.</p>
          </div>
          <Link to={ROUTE_PATHS.tools}>View all tools</Link>
        </div>

        <div className="tool-grid simple-tool-grid">
          {featuredTools.map((tool) => (
            <Link key={tool.path} to={tool.path} className="simple-tool-card">
              <div className="simple-tool-icon">✓</div>
              <div>
                <h3>{tool.title}</h3>
                <p>{tool.text}</p>
              </div>
              <span className="simple-tool-open">Open →</span>
            </Link>
          ))}
        </div>
      </section>

      <Card className="panel quick-help">
        <h3>What is this website?</h3>
        <p>MCPL Tools is a small collection of practical engineering utilities. No technical setup is needed for the calculators.</p>
      </Card>
    </div>
  )
}
