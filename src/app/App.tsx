import { HashRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { AppRouter } from '../router/AppRouter'
import { AppProviders } from './providers/AppProviders'

export function App() {
  return (
    <AppProviders>
      <HashRouter>
        <AppShell>
          <AppRouter />
        </AppShell>
      </HashRouter>
    </AppProviders>
  )
}

export default App
