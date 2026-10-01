import { useLocation } from 'react-router-dom'
import { ROUTE_PATHS } from '../../app/config/constants'
import { Breadcrumbs } from './Breadcrumbs'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const isMtoRoute = location.pathname === ROUTE_PATHS.mtoGenerator

  if (isMtoRoute) {
    return <div className="mto-route-shell">{children}</div>
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="workspace-shell">
        <Header />
        <div className="workspace-body">
          <Breadcrumbs />
          <main className="content-panel">{children}</main>
        </div>
      </div>
    </div>
  )
}
