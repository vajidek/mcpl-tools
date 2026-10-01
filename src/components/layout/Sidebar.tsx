import { NavLink } from 'react-router-dom'
import { ROUTE_PATHS } from '../../app/config/constants'

const items = [
  { label: 'Dashboard', path: ROUTE_PATHS.dashboard },
  { label: 'Servers', path: ROUTE_PATHS.servers },
  { label: 'Tools', path: ROUTE_PATHS.tools },
  { label: 'Resources', path: ROUTE_PATHS.resources },
  { label: 'Prompts', path: ROUTE_PATHS.prompts },
  { label: 'Executions', path: ROUTE_PATHS.executions },
  { label: 'Logs', path: ROUTE_PATHS.logs },
  { label: 'Integrations', path: ROUTE_PATHS.integrations },
  { label: 'Settings', path: ROUTE_PATHS.settings },
]

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand-block">
        <div className="brand-mark">M</div>
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>MCPL Tools</h1>
        </div>
      </div>

      <nav className="nav-list">
        {items.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            <span>
              <strong>{item.label}</strong>
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
