import { BrowserRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { AppRouter } from '../router/AppRouter'
import { AppProviders } from './providers/AppProviders'

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppShell>
          <AppRouter />
        </AppShell>
      </BrowserRouter>
    </AppProviders>
  )
}

export default App
