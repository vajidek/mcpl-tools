import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '../../../app/config/constants'

const tools = [
  { title: 'MTO Generator', category: 'Estimation', text: 'Create, edit, print and download material take-off sheets.', path: ROUTE_PATHS.mtoGenerator },
  { title: 'Pipe Weight Calculator', category: 'Mechanical', text: 'Calculate kg/m and total pipe weight.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'pipe-weight') },
  { title: 'Pipe Internal Volume', category: 'Piping', text: 'Calculate pipeline water volume from diameter and length.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'pipe-volume') },
  { title: 'Flow Velocity Calculator', category: 'Piping', text: 'Calculate water velocity from flow and pipe diameter.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'flow-velocity') },
  { title: 'Pipe Head Loss Calculator', category: 'Piping', text: 'Estimate friction head loss using the Hazen-Williams method.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'head-loss') },
  { title: 'Pipe Surface Area', category: 'Piping', text: 'Calculate external pipe area for coating or painting quantities.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'pipe-area') },
  { title: 'Pipe Quantity Calculator', category: 'Procurement', text: 'Calculate required pipe pieces from total length and standard piece length.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'pipe-quantity') },
  { title: 'Steel Plate Weight Calculator', category: 'Mechanical', text: 'Calculate the weight of a steel plate from size, thickness and density.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'steel-plate-weight') },
  { title: 'Pump Power Calculator', category: 'Mechanical', text: 'Estimate pump shaft power from flow, head and efficiency.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'pump-power') },
  { title: 'Pressure to Head Converter', category: 'Mechanical', text: 'Convert pressure in bar or MPa to water head in metres.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'pressure-head') },
  { title: 'Steel Bar Weight Calculator', category: 'Civil', text: 'Calculate reinforcement bar weight from diameter and length.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'steel-bar-weight') },
  { title: 'Concrete Volume Calculator', category: 'Civil', text: 'Calculate volume from length × width × height.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'concrete-volume') },
  { title: 'Excavation & Backfill Calculator', category: 'Civil / Pipeline', text: 'Estimate trench excavation and approximate backfill quantity.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'trench-volume') },
  { title: 'Tank Volume Calculator', category: 'Civil / WTP', text: 'Calculate rectangular or cylindrical tank capacity.', path: ROUTE_PATHS.utilityTool.replace(':toolSlug', 'tank-volume') },
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
          <h2>Engineering tools</h2>
          <p className="tool-description">Mechanical-first tools for piping, pumps, estimation and project work, with essential civil utilities.</p>
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
