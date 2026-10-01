export type AppEnvironment = 'development' | 'test' | 'production'

export const getEnvironment = (): AppEnvironment => {
  const mode = import.meta.env.MODE as AppEnvironment | undefined
  return mode ?? 'development'
}

export const isDevEnvironment = (): boolean => getEnvironment() === 'development'
export const isProdEnvironment = (): boolean => getEnvironment() === 'production'
