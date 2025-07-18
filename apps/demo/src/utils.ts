import { PrKey } from '@diff-viewer'
import { LineRange } from '@diff-viewer'

/**
 * Set the URL to the given PR.
 *
 * @param pr - The PR to set the URL to.
 */
export const setURL = (pr: PrKey | null): void => {
  if (!pr) return
  const params = new URLSearchParams()
  params.set('owner', pr.owner)
  params.set('repo', pr.repo)
  params.set('pull', String(pr.pullNumber))
  const newUrl = `${window.location.pathname}?${params.toString()}`
  window.history.pushState({}, '', newUrl)
}

/**
 * Set the line parameter in the URL based on line range selection.
 *
 * @param lineRange - The line range to set in the URL.
 * @param fileNames - The file names to set in the URL.
 */
export const setLineURL = (lineRange: LineRange, fileNames: string[]): void => {
  const params = new URLSearchParams(window.location.search)
  const side = lineRange.side === 'left' ? 'L' : 'R'
  const start = lineRange.start
  const end = lineRange.end
  const lineParam = start === end ? `${side}${start}` : `${side}${start}-${side}${end}`
  params.set('line', lineParam)

  const sortedFileNames = [...fileNames].sort()
  const fileIndex = sortedFileNames.indexOf(lineRange.filepath)
  params.set('file', String(fileIndex))

  const newUrl = `${window.location.pathname}?${params.toString()}`
  window.history.pushState({}, '', newUrl)
}

/**
 * Parse the URL to get the PR.
 *
 * @returns The PR from the URL.
 */
export const parseURL = (): PrKey | undefined => {
  const params = new URLSearchParams(window.location.search)
  const owner = params.get('owner')
  const repo = params.get('repo')
  const pullStr = params.get('pull')
  if (owner && repo && pullStr) {
    const pullNumber = Number(pullStr)
    if (!Number.isNaN(pullNumber)) {
      return { owner, repo, pullNumber }
    }
  }
  return undefined
}

/**
 * Parse the line parameter from the URL to get the highlighted lines.
 *
 * @param fileNames - The file names to parse the URL for.
 * @returns The LineRange from the URL, or undefined if not present.
 */
export const parseLineURL = (fileNames: string[]): LineRange | undefined => {
  const params = new URLSearchParams(window.location.search)
  const lineParam = params.get('line')
  const fileIndexStr = params.get('file')

  if (!lineParam || !fileIndexStr) return undefined

  // Sort file names alphabetically
  const sortedFileNames = [...fileNames].sort()

  // Parse the file index from the URL parameter
  const fileIndex = Number(fileIndexStr)
  if (Number.isNaN(fileIndex) || fileIndex < 0 || fileIndex >= sortedFileNames.length) {
    return undefined
  }

  // Get the filepath from the sorted array using the index
  const filepath = sortedFileNames[fileIndex]

  // Parse formats like: L1, R1, L1-R5, R75-R89
  const singleLineMatch = lineParam.match(/^([LR])(\d+)$/)
  if (singleLineMatch) {
    const [, side, lineNum] = singleLineMatch
    return {
      side: side === 'L' ? 'left' : 'right',
      start: Number(lineNum),
      end: Number(lineNum),
      filepath,
    }
  }

  const rangeMatch = lineParam.match(/^([LR])(\d+)-([LR])(\d+)$/)
  if (rangeMatch) {
    const [, startSide, startLine, endSide, endLine] = rangeMatch
    // Ensure both sides are the same (L1-R5 or R75-R89, not L1-R5)
    if (startSide === endSide) {
      return {
        side: startSide === 'L' ? 'left' : 'right',
        start: Number(startLine),
        end: Number(endLine),
        filepath,
      }
    }
  }

  return undefined
}
