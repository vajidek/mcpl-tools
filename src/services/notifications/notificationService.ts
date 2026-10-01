export const notify = (title: string, message: string, tone: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  console.info(`[${tone}] ${title}: ${message}`)
  return { title, message, tone }
}
