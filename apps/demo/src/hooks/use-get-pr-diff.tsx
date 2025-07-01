import { useCallback, useEffect, useRef, useState } from 'react'
import { DiffParserAdapter } from '@diff-viewer'
import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { UseGetPrDiffParams, UseGetPrDiffReturn } from './types'

/**
 * React hook that retrieves the diff of a GitHub Pull Request and parses it using DiffParserAdapter.
 *
 * Basic usage:
 *   const { data, loading, error } = useGetPrDiff({ owner: 'facebook', repo: 'react', pullNumber: 1 })
 */
export default function useGetPrDiff({ owner, repo, pullNumber, token }: UseGetPrDiffParams): UseGetPrDiffReturn {
  const [data, setData] = useState<UseGetPrDiffReturn['data']>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()

  // Keep the latest params in a ref so fetchData remains stable between renders.
  const paramsRef = useRef<UseGetPrDiffParams>({ owner, repo, pullNumber, token })
  paramsRef.current = { owner, repo, pullNumber, token }

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    const { owner, repo, pullNumber, token } = paramsRef.current
    if (!owner || !repo || !pullNumber) return

    setLoading(true)
    setError(undefined)

    try {
      const url = `${GITHUB_API_HOST}/repos/${owner}/${repo}/pulls/${pullNumber}`
      const res = await fetch(url, {
        headers: {
          ...buildHeaders(token),
          // Override the Accept header to request the unified diff format.
          Accept: 'application/vnd.github.v3.diff',
        },
        signal,
      })

      if (!res.ok) {
        throw new Error(`GitHub API error (${res.status}): ${await getGithubError(res)}`)
      }

      const diffText = await res.text()
      const parsedDiff = new DiffParserAdapter().parse(diffText)
      setData(parsedDiff)
    } catch (err: unknown) {
      // Ignore abort errors triggered by the AbortController
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void fetchData(controller.signal)
    return () => controller.abort()
  }, [owner, repo, pullNumber, token, fetchData])

  const refetch = useCallback(() => {
    const controller = new AbortController()
    void fetchData(controller.signal)
  }, [fetchData])

  return { data, loading, error, refetch }
}
