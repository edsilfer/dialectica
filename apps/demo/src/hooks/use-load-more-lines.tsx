import { LineRequest } from '@diff-viewer'
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
  headSha: string
}): UseLoadMoreLinesReturn {
  const { useMocks } = useSettings()

  // These three are still handy for spinners / toasts
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | undefined>()
  const [data, setData] = useState<Map<number, string>>(new Map())

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

  const fetchLines = useCallback(
    async ({ fileKey, startLine, endLine }: LineRequest): Promise<Map<number, string>> => {
      if (!base.owner || !base.repo || !base.pullNumber || !fileKey) {
        return new Map()
      }

      if (!base.headSha) {
        throw new Error('Head SHA is required for loading more lines')
      }

      setLoading(true)
      setError(undefined)

      try {
        if (useMocks) {
          const mock = new Map<number, string>()
          for (let i = startLine; i <= endLine; i++) {
            mock.set(i, `// mock line ${i} of ${fileKey}`)
          }
          setData(mock)
          return mock
        }

        // Get file content at the provided SHA _________________
        const fileRes = await fetch(
          `${GITHUB_API_HOST}/repos/${base.owner}/${base.repo}/contents/${encodeURIComponent(fileKey)}?ref=${base.headSha}`,
          { headers: buildHeaders(base.githubToken) },
        )
        if (!fileRes.ok) throw new Error(await getGithubError(fileRes))
        const fileJson = (await fileRes.json()) as FileContentResponse

        // Slice the requested lines ____________________________
        const linesArr = decodeBase64(fileJson.content).split('\n')
        const slice = new Map<number, string>()
        for (let i = startLine; i <= endLine && i <= linesArr.length; i++) {
          slice.set(i, linesArr[i - 1])
        }
        setData(slice)
        return slice
      } catch (err) {
        setError(err as Error)
        throw err // propagate → lets <DiffViewer> handle failures
      } finally {
        setLoading(false)
      }
    },
    [base.owner, base.repo, base.pullNumber, base.githubToken, base.headSha, useMocks],
  )

  return { loading, error, data, fetchLines }
}
