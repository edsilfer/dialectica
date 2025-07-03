import { useCallback, useSyncExternalStore } from 'react'
import { LoadMoreLinesHandler } from '../../../../main/types'
import { SourceCodeViewModel } from '../../source-code/models/SourceCodeViewModel'
import { LinePair } from '../types'
import { LoadLinesParams } from './types'
import { HunkDirection } from '../../source-code/models/HunkHeaderViewModel'

export type LoadMoreDirection = 'up' | 'down' | 'out' | 'in_up' | 'in_down'

/**
 * React hook that gives consumers a { lines, loadMore } API.
 *
 * @param sourceCode      - The source code view model.
 * @param onLoadMoreLines - The handler to fetch more lines.
 * @returns                 The lines and the loadMore callback.
 */
export function useLoadMoreLines(sourceCode: SourceCodeViewModel, onLoadMoreLines?: LoadMoreLinesHandler) {
  const lines = useSyncExternalStore(sourceCode.subscribe, () => sourceCode.lines)

  const loadMore = useCallback(
    async (pivot: LinePair, direction: HunkDirection) => {
      if (!sourceCode.fileKey || !onLoadMoreLines) return

      try {
        const updatedLines = await loadLines({
          sourceCode,
          fileKey: sourceCode.fileKey,
          handler: onLoadMoreLines,
          pivot,
          direction,
        })
        sourceCode.setLines(updatedLines)
      } catch (err) {
        console.error(err)
      }
    },
    [sourceCode, onLoadMoreLines],
  )

  return { lines, loadMore }
}

/**
 * Given a pivot line and direction, fetch extra lines and splice them into the existing array
 *
 * @param params - The parameters for loading more lines.
 * @returns The updated lines.
 */
async function loadLines(params: LoadLinesParams): Promise<LinePair[]> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { sourceCode, fileKey, pivot, direction, handler } = params

  const fetch = async (dir: HunkDirection) => {
    const hunkState = sourceCode.hunkStates.get(pivot)
    if (!hunkState) return undefined

    let range: { start: number; end: number } | undefined
    if (dir === 'up') {
      range = hunkState.prevRange
    } else if (dir === 'down') {
      range = hunkState.nextRange
    } else if (dir === 'in_up') {
      range = hunkState.upRange
    } else if (dir === 'in_down') {
      range = hunkState.downRange
    } else {
      range = hunkState.nextRange // fallback
    }

    if (!range) return undefined

    return handler({ fileKey, startLine: range.start, endLine: range.end })
  }

  const inject = (extra: Record<number, string>, pos: 'before' | 'after') => sourceCode.injectLines(extra, pivot, pos)

  if (direction === 'out') {
    // dual-arrow header: load both sides in parallel
    const [upExtra, downExtra] = await Promise.all([fetch('up'), fetch('down')])

    let updated = [...sourceCode.lines]
    if (upExtra) updated = inject(upExtra, 'before')
    if (downExtra) updated = inject(downExtra, 'after')
    return updated
  }

  const extra = await fetch(direction as HunkDirection)
  if (!extra) return [...sourceCode.lines]

  const pos =
    direction === 'up' ? 'before' : direction === 'in_up' ? 'after' : direction === 'in_down' ? 'before' : 'after'

  return inject(extra, pos)
}
