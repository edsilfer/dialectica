import { PullRequestMetadata } from '@diff-viewer'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FACEBOOK_REACT_33665_METADATA } from '../__fixtures__/metadata-fixtures'
import { useSettings } from '../provider/setttings-provider'
import { mapPullRequestMetadata } from './mappers'
import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { UseGetPrMetadataParams, UseGetPrMetadataReturn } from './types'

/**
 * React hook that retrieves Pull Request metadata from GitHub's REST API.
 *
 * Basic usage:
 *   const { data, loading, error } = useGetPrMetadata({ owner: 'facebook', repo: 'react', pullNumber: 1 })
 */
export default function useGetPrMetadata({
  owner,
  repo,
  pullNumber,
  forceDelayMs = 0,
}: UseGetPrMetadataParams): UseGetPrMetadataReturn {
  const [data, setData] = useState<PullRequestMetadata>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const { githubPat, useMocks } = useSettings()

  const paramsRef = useRef<UseGetPrMetadataParams>({ owner, repo, pullNumber, forceDelayMs })
  paramsRef.current = { owner, repo, pullNumber, forceDelayMs }

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      const { owner, repo, pullNumber, forceDelayMs } = paramsRef.current
      if (!owner || !repo || !pullNumber) return

      setLoading(true)
      setError(undefined)

      try {
        if (useMocks) {
          // Return mock data when useMocks is true
          await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay
          setData(mapPullRequestMetadata(FACEBOOK_REACT_33665_METADATA as Parameters<typeof mapPullRequestMetadata>[0]))
        } else {
          // Make actual API call when useMocks is false
          const url = `${GITHUB_API_HOST}/repos/${owner}/${repo}/pulls/${pullNumber}`

          // Only pass token to buildHeaders if githubPat is not empty
          const token = githubPat.trim() !== '' ? githubPat : undefined

          const res = await fetch(url, { headers: buildHeaders(token), signal })
          if (!res.ok) {
            throw new Error(`GitHub API error (${res.status}): ${await getGithubError(res)}`)
          }
          const pr = (await res.json()) as Parameters<typeof mapPullRequestMetadata>[0]
          setData(mapPullRequestMetadata(pr))
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err)
        }
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
  }, [owner, repo, pullNumber, forceDelayMs, useMocks, fetchData])

  const refetch = useCallback(() => {
    const controller = new AbortController()
    void fetchData(controller.signal)
  }, [fetchData])

  return { data, loading, error, refetch }
}
