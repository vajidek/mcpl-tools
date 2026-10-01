type StatusIndicatorProps = {
  status: 'online' | 'offline' | 'warning' | 'error'
  label?: string
}

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  return (
    <span className={`status-indicator status-${status}`}>
      {label ?? status}
    </span>
  )
}
