import { useCallback, useEffect, useRef, useState } from 'react'
import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import { FACEBOOK_REACT_33665_DIFF } from '../__fixtures__/diffs-fixtures'
import { useSettings } from '../provider/setttings-provider'
import type { UseGetPrDiffParams, UseGetPrDiffReturn } from './types'

/**
 * React hook that retrieves the raw diff text of a GitHub Pull Request.
 *
 * Basic usage:
 *   const { data, loading, error } = useGetPrDiff({ owner: 'facebook', repo: 'react', pullNumber: 1 })
 */
export default function useGetPrDiff({
  owner,
  repo,
  pullNumber,
  forceDelayMs = 0,
}: UseGetPrDiffParams): UseGetPrDiffReturn {
  const [data, setData] = useState<UseGetPrDiffReturn['data']>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const { githubPat, useMocks } = useSettings()

  // Keep the latest params in a ref so fetchData remains stable between renders.
  const paramsRef = useRef<UseGetPrDiffParams>({ owner, repo, pullNumber, forceDelayMs })
  paramsRef.current = { owner, repo, pullNumber, forceDelayMs }

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      const { owner, repo, pullNumber, forceDelayMs } = paramsRef.current
      if (!owner || !repo || !pullNumber) return

      setLoading(true)
      setError(undefined)

      try {
        if (useMocks) {
          // When in mock mode, use the Facebook diff from fixtures
          setData(FACEBOOK_REACT_33665_DIFF)
        } else {
          const url = `${GITHUB_API_HOST}/repos/${owner}/${repo}/pulls/${pullNumber}`

          // Only pass token to buildHeaders if githubPat is not empty
          const token = githubPat.trim() !== '' ? githubPat : undefined

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
          setData(diffText)
        }
      } catch (err: unknown) {
        // Ignore abort errors triggered by the AbortController
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        setError(err as Error)
      } finally {
        if (forceDelayMs && forceDelayMs > 0) {
          await new Promise((res) => setTimeout(res, forceDelayMs))
        }
        setLoading(false)
      }
    },
    [githubPat, useMocks],
  )

  useEffect(() => {
    const controller = new AbortController()
    void fetchData(controller.signal)
    return () => controller.abort()
  }, [owner, repo, pullNumber, forceDelayMs, fetchData])

  const refetch = useCallback(() => {
    const controller = new AbortController()
    void fetchData(controller.signal)
  }, [fetchData])

  return { data, loading, error, refetch }
}
