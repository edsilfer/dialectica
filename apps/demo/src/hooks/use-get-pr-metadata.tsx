import { useCallback, useEffect, useRef, useState } from 'react'
import { mapPullRequestMetadata } from './mappers'
import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { UseGetPrMetadataParams, UseGetPrMetadataReturn } from './types'
import { PullRequestMetadata } from '@diff-viewer/dist'

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
  token,
  forceDelayMs = 0,
}: UseGetPrMetadataParams): UseGetPrMetadataReturn {
  const [data, setData] = useState<PullRequestMetadata>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()

  const paramsRef = useRef<UseGetPrMetadataParams>({ owner, repo, pullNumber, token, forceDelayMs })
  paramsRef.current = { owner, repo, pullNumber, token, forceDelayMs }

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    const { owner, repo, pullNumber, token, forceDelayMs } = paramsRef.current
    if (!owner || !repo || !pullNumber) return

    setLoading(true)
    setError(undefined)

    try {
      const url = `${GITHUB_API_HOST}/repos/${owner}/${repo}/pulls/${pullNumber}`
      const res = await fetch(url, { headers: buildHeaders(token), signal })
      if (!res.ok) {
        throw new Error(`GitHub API error (${res.status}): ${await getGithubError(res)}`)
      }
      const pr = (await res.json()) as Parameters<typeof mapPullRequestMetadata>[0]
      setData(mapPullRequestMetadata(pr))
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
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void fetchData(controller.signal)
    return () => controller.abort()
  }, [owner, repo, pullNumber, token, forceDelayMs, fetchData])

  const refetch = useCallback(() => {
    const controller = new AbortController()
    void fetchData(controller.signal)
  }, [fetchData])

  return { data, loading, error, refetch }
}
