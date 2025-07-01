import { useCallback, useEffect, useRef, useState } from 'react'
import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import { SAMPLE_COMMENTS } from '../__fixtures__/comments-fixtures'
import { useSettings } from '../provider/setttings-provider'
import type { UseListInlineCommentsParams, UseListInlineCommentsReturn, GitHubInlineComment } from './types'

/**
 * React hook that retrieves the inline comments (review comments) of a GitHub Pull Request.
 *
 * Basic usage:
 *   const { data, loading, error } = useListInlineComments({ owner: 'facebook', repo: 'react', pullNumber: 1 })
 */
export default function useListInlineComments({
  owner,
  repo,
  pullNumber,
  forceDelayMs = 0,
}: UseListInlineCommentsParams): UseListInlineCommentsReturn {
  const [data, setData] = useState<UseListInlineCommentsReturn['data']>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const { githubPat, useMocks } = useSettings()

  // Keep the latest params in a ref so fetchData remains stable between renders.
  const paramsRef = useRef<UseListInlineCommentsParams>({ owner, repo, pullNumber, forceDelayMs })
  paramsRef.current = { owner, repo, pullNumber, forceDelayMs }

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      const { owner, repo, pullNumber, forceDelayMs } = paramsRef.current
      if (!owner || !repo || !pullNumber) return

      setLoading(true)
      setError(undefined)

      try {
        if (useMocks) {
          // When in mock mode, use the sample comments from fixtures
          setData(SAMPLE_COMMENTS as GitHubInlineComment[])
        } else {
          const url = `${GITHUB_API_HOST}/repos/${owner}/${repo}/pulls/${pullNumber}/comments`

          // Only pass token to buildHeaders if githubPat is not empty
          const token = githubPat.trim() !== '' ? githubPat : undefined

          const res = await fetch(url, {
            headers: buildHeaders(token),
            signal,
          })

          if (!res.ok) {
            throw new Error(`GitHub API error (${res.status}): ${await getGithubError(res)}`)
          }

          const comments = (await res.json()) as GitHubInlineComment[]
          setData(comments)
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
