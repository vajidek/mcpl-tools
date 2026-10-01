import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '../../app/config/constants'

export function Header() {
  return (
    <header className="topbar">
      <Link to={ROUTE_PATHS.dashboard} className="topbar-brand">
        <img src={`${import.meta.env.BASE_URL}midland-logo.svg`} alt="Midland Contracting Private Limited" />
      </Link>
      <div className="topbar-text">Mechanical • Piping • Project Tools</div>
    </header>
  )
}
