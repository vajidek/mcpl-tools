import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type AlertProps = {
  tone?: 'info' | 'success' | 'warning' | 'error'
  children: ReactNode
}

export function Alert({ tone = 'info', children }: AlertProps) {
  return <div className={cn('alert', `alert-${tone}`)}>{children}</div>
}
