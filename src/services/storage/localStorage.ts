export const readStorage = <T>(key: string, fallback: T): T => {
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export const writeStorage = <T>(key: string, value: T) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures in browser-only environments.
  }
}
