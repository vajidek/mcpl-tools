import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { navigationItems } from '../config/navigation'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand-block">
          <div className="brand-mark">M</div>
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>MCPL Tools</h1>
          </div>
        </div>

        <nav className="nav-list">
          {navigationItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
              {item.badge ? <em>{item.badge}</em> : null}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content-panel">{children}</main>
    </div>
  )
}
