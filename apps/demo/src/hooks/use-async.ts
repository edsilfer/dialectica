import React, { useEffect, useState } from 'react'

export type AsyncState<T> = {
  /** The data returned by the fetcher. */
  data: T | undefined
  /** Whether the fetcher is loading. */
  loading: boolean
  /** The error returned by the fetcher. */
  error: Error | undefined
}

/**
 * Generic async hook that centralises loading and error handling for a promise‑returning fetcher.
 *
 * @param enabled - Whether the fetcher should run.
 * @param deps    - The dependencies to watch for changes.
 * @param fetcher - The function to fetch the data.
 * @returns         The data, loading state, and error state.
 */
export function useAsync<T>(enabled: boolean, deps: React.DependencyList, fetcher: () => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | undefined>(undefined)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    setLoading(true)
    setError(undefined)

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err as Error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, deps)

  return { data, loading, error }
}
