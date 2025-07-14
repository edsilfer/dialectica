import type { LineRequest, LoadMoreLinesResult } from '../../../components/diff-viewer/types'
import type { GetMoreLinesRequest } from './types'
import getFileContent from './get-file-content'

/**
 * Fetches additional context lines for a given file and range on both sides of a Pull Request diff.
 *
 * NOTE: Requires both `baseSha` and `headSha` to be provided in the request params.
 */
export async function getMoreLines(
  params: GetMoreLinesRequest,
  lineRequest: LineRequest,
): Promise<LoadMoreLinesResult> {
  if (!params.prKey.owner || !params.prKey.repo || !params.prKey.pullNumber || !lineRequest.fileKey) {
    return { leftLines: new Map(), rightLines: new Map() }
  }

  if (!params.baseSha || !params.headSha) {
    throw new Error('Both base SHA and head SHA are required for loading more lines')
  }

  const [oldFileContent, newFileContent] = await Promise.allSettled([
    getFileContent({ ...params, filePath: lineRequest.fileKey, sha: params.baseSha }),
    getFileContent({ ...params, filePath: lineRequest.fileKey, sha: params.headSha }),
  ])

  const leftContent = oldFileContent.status === 'fulfilled' ? oldFileContent.value : ''
  const rightContent = newFileContent.status === 'fulfilled' ? newFileContent.value : ''

  const result: LoadMoreLinesResult = {
    leftLines: extractLines(leftContent, lineRequest.leftRange.start, lineRequest.leftRange.end),
    rightLines: extractLines(rightContent, lineRequest.rightRange.start, lineRequest.rightRange.end),
  }

  return result
}

function extractLines(content: string, start: number, end: number): Map<number, string> {
  if (!content) return new Map()

  const linesArr = content.split('\n')
  const slice = new Map<number, string>()

  for (let i = start; i <= end && i <= linesArr.length; i++) {
    slice.set(i, linesArr[i - 1] || '')
  }

  return slice
}

export default getMoreLines
