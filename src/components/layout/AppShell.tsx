import type { ReactNode } from 'react'
import { Breadcrumbs } from './Breadcrumbs'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
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
