import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { ROUTE_PATHS } from '../../../app/config/constants'

const featuredTools = [
  {
    title: 'MTO Generator',
    text: 'Create a clean material take-off table, add items, print it or download CSV.',
    path: ROUTE_PATHS.mtoGenerator,
  },
  {
    title: 'Pipe Weight Calculator',
    text: 'Calculate pipe weight per metre and total weight from diameter and thickness.',
    path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'pipe-weight'),
  },
  {
    title: 'Steel Plate Weight',
    text: 'Get the weight of a steel plate from length, width and thickness.',
    path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'steel-plate-weight'),
  },
  {
    title: 'Pump Power',
    text: 'Estimate pump power from flow, head and efficiency.',
    path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'pump-power'),
  },
  {
    title: 'Concrete Volume',
    text: 'Calculate concrete quantity from dimensions.',
    path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'concrete-volume'),
  },
  {
    title: 'Unit Converter',
    text: 'Convert common length, area, volume and weight units.',
    path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'unit-converter'),
  },
]

export function DashboardPage() {
  return (
    <div className="page-stack">
      <section className="welcome-hero">
        <div>
          <p className="eyebrow">MCPL Tools</p>
          <h2>Useful tools. No complicated setup.</h2>
          <p>Small, practical tools for site work, engineering, estimation and office tasks.</p>
        </div>
        <Link to={ROUTE_PATHS.mtoGenerator} className="primary-button button-link">Open MTO Generator</Link>
      </section>

      <section className="section-block">
        <div className="section-header">
          <div>
            <h3>Popular tools</h3>
            <p className="tool-description">Pick a tool and start working immediately.</p>
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
        <p>MCPL Tools is a collection of small work utilities. Use a tool directly without learning a technical system or setting up anything first.</p>
      </Card>
    </div>
  )
}
