import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('card', className)} {...props}>
      {children}
    </div>
  )
}
