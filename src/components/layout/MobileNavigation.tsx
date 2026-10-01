import { NavLink } from 'react-router-dom'
import { ROUTE_PATHS } from '../../app/config/constants'

const items = [
  ROUTE_PATHS.dashboard,
  ROUTE_PATHS.servers,
  ROUTE_PATHS.tools,
  ROUTE_PATHS.executions,
  ROUTE_PATHS.settings,
]

export function MobileNavigation() {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {items.map((item) => (
        <NavLink key={item} to={item} className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}>
          {item.replace('/', '') || 'home'}
        </NavLink>
      ))}
    </nav>
  )
}
