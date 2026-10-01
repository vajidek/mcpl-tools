import type { AppMetric } from '../types'

type StatCardProps = {
  item: AppMetric
}

export function StatCard({ item }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className={`status-dot status-dot-${item.tone}`} aria-hidden="true" />
      <p className="stat-label">{item.label}</p>
      <h3>{item.value}</h3>
      <small>{item.detail}</small>
    </article>
  )
}
