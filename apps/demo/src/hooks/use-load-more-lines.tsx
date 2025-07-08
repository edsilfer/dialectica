import { LineRequest, LoadMoreLinesResult } from '@diff-viewer'
import { useCallback, useState } from 'react'
import { useSettings } from '../provider/setttings-provider'
import { buildHeaders, decodeBase64, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { UseLoadMoreLinesReturn } from './types'

// Type definitions for GitHub API responses
interface FileContentResponse {
  /* The base64-encoded content of the file */
  content: string
  /* The encoding of the file */
  encoding: string
}

export default function useLoadMoreLines(base: {
  owner: string
  repo: string
  pullNumber: number
  githubToken: string
  baseSha: string
  headSha: string
}): UseLoadMoreLinesReturn {
  const { useMocks } = useSettings()

  // These three are still handy for spinners / toasts
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | undefined>()
  const [data, setData] = useState<{ leftLines: Map<number, string>; rightLines: Map<number, string> }>({
    leftLines: new Map(),
    rightLines: new Map(),
  })

  /**
   * Fetches file content for a specific SHA and path.
   */
  const fetchFileContent = useCallback(
    async (filePath: string, sha: string): Promise<string> => {
      const fileRes = await fetch(
        `${GITHUB_API_HOST}/repos/${base.owner}/${base.repo}/contents/${encodeURIComponent(filePath)}?ref=${sha}`,
        { headers: buildHeaders(base.githubToken) },
      )

      if (!fileRes.ok) {
        // Handle 404s gracefully for new/deleted files
        if (fileRes.status === 404) {
          return ''
        }
        throw new Error(await getGithubError(fileRes))
      }

      const fileJson = (await fileRes.json()) as FileContentResponse
      return decodeBase64(fileJson.content)
    },
    [base.owner, base.repo, base.githubToken],
  )

  /**
   * Extracts specific lines from file content.
   */
  const extractLines = useCallback((content: string, startLine: number, endLine: number): Map<number, string> => {
    if (!content) return new Map()

    const linesArr = content.split('\n')
    const slice = new Map<number, string>()

    for (let i = startLine; i <= endLine && i <= linesArr.length; i++) {
      slice.set(i, linesArr[i - 1] || '')
    }

    return slice
  }, [])

  const fetchLines = useCallback(
    async ({ fileKey, leftRange, rightRange }: LineRequest): Promise<LoadMoreLinesResult> => {
      console.log('fetchLines', { fileKey, leftRange, rightRange })
      if (!base.owner || !base.repo || !base.pullNumber || !fileKey) {
        return { leftLines: new Map(), rightLines: new Map() }
      }

      if (!base.baseSha || !base.headSha) {
        throw new Error('Both base SHA and head SHA are required for loading more lines')
      }

      setLoading(true)
      setError(undefined)

      try {
        if (useMocks) {
          const leftLines = new Map<number, string>()
          const rightLines = new Map<number, string>()

          for (let i = leftRange.start; i <= leftRange.end; i++) {
            leftLines.set(i, `// mock left line ${i} of ${fileKey}`)
          }

          for (let i = rightRange.start; i <= rightRange.end; i++) {
            rightLines.set(i, `// mock right line ${i} of ${fileKey}`)
          }

          const result = { leftLines, rightLines }
          setData(result)
          return result
        }

        // Fetch content from both old and new file versions
        const [oldFileContent, newFileContent] = await Promise.allSettled([
          fetchFileContent(fileKey, base.baseSha),
          fetchFileContent(fileKey, base.headSha),
        ])

        // Handle old file content
        const oldContent = oldFileContent.status === 'fulfilled' ? oldFileContent.value : ''
        const leftLines = extractLines(oldContent, leftRange.start, leftRange.end)

        // Handle new file content
        const newContent = newFileContent.status === 'fulfilled' ? newFileContent.value : ''
        const rightLines = extractLines(newContent, rightRange.start, rightRange.end)

        const result = { leftLines, rightLines }
        setData(result)
        return result
      } catch (err) {
        setError(err as Error)
        throw err // propagate → lets <DiffViewer> handle failures
      } finally {
        setLoading(false)
      }
    },
    [base.owner, base.repo, base.pullNumber, base.baseSha, base.headSha, useMocks, fetchFileContent, extractLines],
  )

  return { loading, error, data, fetchLines }
}
