import { Link } from 'react-router-dom'

export function Breadcrumbs({ items = [] }: { items?: Array<{ label: string; path?: string }> }) {
  if (!items.length) {
    return null
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item.label}>
          {item.path ? <Link to={item.path}>{item.label}</Link> : <span>{item.label}</span>}
          {index < items.length - 1 ? <span className="breadcrumb-separator">/</span> : null}
        </span>
      ))}
    </nav>
  )
}
