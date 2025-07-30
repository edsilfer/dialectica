import React, { useEffect, useState, useCallback } from 'react'

export type AsyncState<T> = {
  /** The data returned by the fetcher. */
  data: T | undefined
  /** Whether the fetcher is loading. */
  loading: boolean
  /** The error returned by the fetcher. */
  error: Error | undefined
  /** Function to trigger a refetch */
  refetch: () => void
}

/**
 * Generic async hook that centralises loading and error handling for a promise‑returning fetcher.
 *
 * @param enabled - Whether the fetcher should run.
 * @param deps    - The dependencies to watch for changes.
 * @param fetcher - The function to fetch the data.
 * @returns         The data, loading state, error state, and refetch function.
 */
export function useAsync<T>(enabled: boolean, deps: React.DependencyList, fetcher: () => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    if (!fetcher) {
      setLoading(false)
      return
    }

    let cancelled = false

    setLoading(true)
    setError(undefined)

    try {
      fetcher()
        .then((result) => {
          if (!cancelled) setData(result)
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            // Convert non-Error objects to Error instances
            const error = err instanceof Error ? err : new Error(String(err))
            setError(error)
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    } catch (err) {
      if (!cancelled) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setLoading(false)
      }
    }

    return () => {
      cancelled = true
    }
  }, [...deps, refetchTrigger, enabled])

  return { data, loading, error, refetch }
}
