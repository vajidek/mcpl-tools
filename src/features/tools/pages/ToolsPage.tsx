import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '../../../app/config/constants'

const tools = [
  { title: 'MTO Generator', category: 'Estimation', text: 'Create, edit, print and download material take-off sheets.', path: ROUTE_PATHS.mtoGenerator },
  { title: 'Pipe Weight Calculator', category: 'Mechanical', text: 'Calculate kg/m and total pipe weight.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'pipe-weight') },
  { title: 'Steel Plate Weight Calculator', category: 'Mechanical', text: 'Calculate the weight of a steel plate from size, thickness and density.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'steel-plate-weight') },
  { title: 'Pump Power Calculator', category: 'Mechanical', text: 'Estimate pump shaft power from flow, head and efficiency.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'pump-power') },
  { title: 'Pressure to Head Converter', category: 'Mechanical', text: 'Convert pressure in bar or MPa to water head in metres.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'pressure-head') },
  { title: 'Concrete Volume Calculator', category: 'Civil', text: 'Calculate volume from length × width × height.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'concrete-volume') },
  { title: 'Excavation Volume Calculator', category: 'Civil', text: 'Calculate excavation volume from length, width and depth.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'excavation-volume') },
  { title: 'Wastage Calculator', category: 'Estimation', text: 'Add wastage percentage to a material quantity.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'wastage') },
  { title: 'Unit Converter', category: 'Utility', text: 'Convert common length, area, volume and weight units.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'unit-converter') },
]

export function ToolsPage() {
  const [search, setSearch] = useState('')
  const filteredTools = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tools.filter((tool) => !term || `${tool.title} ${tool.category} ${tool.text}`.toLowerCase().includes(term))
  }, [search])

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Tools</p>
          <h2>All tools</h2>
        </div>
      </header>

      <div className="page-controls">
        <input
          className="text-input"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tools"
          aria-label="Search tools"
        />
      </div>

      <section className="tool-grid simple-tool-grid">
        {filteredTools.map((tool) => (
          <Link key={tool.path} to={tool.path} className="simple-tool-card">
            <div>
              <p className="eyebrow">{tool.category}</p>
              <h3>{tool.title}</h3>
              <p>{tool.text}</p>
            </div>
            <span className="simple-tool-open">Open tool →</span>
          </Link>
        ))}
        {filteredTools.length === 0 ? <div className="empty-state compact">No tools found.</div> : null}
      </section>
    </div>
  )
}
