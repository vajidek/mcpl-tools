import { NavLink } from 'react-router-dom'
import { ROUTE_PATHS } from '../../app/config/constants'

const items = [
  { label: 'Home', path: ROUTE_PATHS.dashboard },
  { label: 'All Tools', path: ROUTE_PATHS.tools },
  { label: 'MTO Generator', path: ROUTE_PATHS.mtoGenerator },
]

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand-block">
        <img className="brand-logo" src={`${import.meta.env.BASE_URL}midland-logo.svg`} alt="Midland Contracting Private Limited" />
      </div>

      <nav className="nav-list">
        {items.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === ROUTE_PATHS.dashboard} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            <strong>{item.label}</strong>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-note">Mechanical-first tools for site, piping, estimation and project work.</div>
    </aside>
  )
}
