import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type BadgeProps = {
  tone?: 'info' | 'success' | 'warning' | 'error'
  children: ReactNode
}

export function Badge({ tone = 'info', children }: BadgeProps) {
  return <span className={cn('badge', `badge-${tone}`)}>{children}</span>
}
