export const readSessionStorage = <T>(key: string, fallback: T): T => {
  try {
    const value = window.sessionStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export const writeSessionStorage = <T>(key: string, value: T) => {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures in browser-only environments.
  }
}
