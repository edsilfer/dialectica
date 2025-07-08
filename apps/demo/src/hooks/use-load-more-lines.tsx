import { LineRequest, LoadMoreLinesResult } from '@diff-viewer'
import { useCallback, useState } from 'react'
import { useSettings } from '../provider/setttings-provider'
import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
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
  const [data, setData] = useState<{ oldLines: Map<number, string>; newLines: Map<number, string> }>({
    oldLines: new Map(),
    newLines: new Map(),
  })

  /** Small helper – works in the browser and Node  */
  const decodeBase64 = (b64: string) => {
    try {
      return atob(b64.replace(/\s/g, ''))
    } catch {
      // Handle Buffer for Node.js environments: use globalThis to access Buffer in a type-safe way
      const globalObj = globalThis as typeof globalThis & {
        Buffer?: {
          from: (str: string, encoding: string) => { toString: (encoding: string) => string }
        }
      }
      if (globalObj.Buffer) {
        return globalObj.Buffer.from(b64, 'base64').toString('utf-8')
      }
      throw new Error('Base64 decoding failed and Buffer is not available')
    }
  }

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
    async ({ fileKey, oldFileRange, newFileRange }: LineRequest): Promise<LoadMoreLinesResult> => {
      if (!base.owner || !base.repo || !base.pullNumber || !fileKey) {
        return { oldLines: new Map(), newLines: new Map() }
      }

      if (!base.baseSha || !base.headSha) {
        throw new Error('Both base SHA and head SHA are required for loading more lines')
      }

      setLoading(true)
      setError(undefined)

      try {
        if (useMocks) {
          const oldLines = new Map<number, string>()
          const newLines = new Map<number, string>()

          for (let i = oldFileRange.startLine; i <= oldFileRange.endLine; i++) {
            oldLines.set(i, `// mock old line ${i} of ${fileKey}`)
          }

          for (let i = newFileRange.startLine; i <= newFileRange.endLine; i++) {
            newLines.set(i, `// mock new line ${i} of ${fileKey}`)
          }

          const result = { oldLines, newLines }
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
        const oldLines = extractLines(oldContent, oldFileRange.startLine, oldFileRange.endLine)

        // Handle new file content
        const newContent = newFileContent.status === 'fulfilled' ? newFileContent.value : ''
        const newLines = extractLines(newContent, newFileRange.startLine, newFileRange.endLine)

        const result = { oldLines, newLines }
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
