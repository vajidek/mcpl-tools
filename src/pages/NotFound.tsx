import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '../app/config/constants'

export function NotFound() {
  return (
    <section className="empty-state">
      <h2>Page not found</h2>
      <p>The route you requested could not be located in the current workspace.</p>
      <Link to={ROUTE_PATHS.dashboard}>Return to dashboard</Link>
    </section>
  )
}
