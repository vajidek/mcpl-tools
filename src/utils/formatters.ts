export const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

export const formatRelativeDate = (value: string): string => {
  const diffMs = Date.now() - new Date(value).getTime()
  const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))

  if (diffDays === 0) {
    return 'today'
  }

  if (diffDays === 1) {
    return '1 day ago'
  }

  return `${diffDays} days ago`
}
