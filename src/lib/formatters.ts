export function formatDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatRelativeTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  const diff = Date.now() - date.getTime()
  const minutes = Math.max(0, Math.round(diff / (1000 * 60)))

  if (minutes < 1) {
    return 'just now'
  }

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.round(minutes / 60)
  return `${hours}h ago`
}
