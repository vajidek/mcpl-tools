import { useEffect, useState } from 'react'

export function useAsync<T>(provider: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true

    provider()
      .then((result) => {
        if (active) {
          setData(result)
        }
      })
      .catch((reason) => {
        if (active) {
          setError(reason)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [provider])

  return { data, loading, error }
}
