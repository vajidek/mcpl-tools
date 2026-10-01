import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {actions ? <div>{actions}</div> : null}
    </header>
  )
}
