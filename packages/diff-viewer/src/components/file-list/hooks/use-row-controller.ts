import { notification } from 'antd'
import { useCallback, useEffect, useReducer } from 'react'
import { FileDiff } from '../../../models/FileDiff'
import { LoadMoreLinesHandler } from '../../../models/LineExtensions'
import { LineMetadata } from '../models/LineMetadata'
import { HunkListViewModel } from '../models/HunkListViewModel'
import { DisplayType, HunkDirection } from '../models/types'
import { HunkListActionType, hunkListReducer } from './use-hunk-list-reducer'

const DEFAULT_MAX_LINES = 10

interface UseRowControllerProps {
  /** The file diff to visualize */
  file: FileDiff
  /** Display mode ('split' or 'unified') */
  mode: DisplayType
  /** Upper bound for lazy-loading, defaults to 10 */
  max?: number
  /** The callback to load more lines from the parent */
  onLoadLines?: LoadMoreLinesHandler
}

interface UseRowControllerReturn {
  /** The hunk list view model */
  hunkList: HunkListViewModel
  /** Handler for loading more lines around a specific line */
  handleLoadLines: (line: LineMetadata, direction: HunkDirection) => Promise<void>
}

/**
 * Hook that handles row-level business logic, including the hunk list state and loading more lines.
 *
 * @param props - The configuration for the row controller
 * @returns Row controller methods and hunk list
 */
export function useRowController(props: UseRowControllerProps): UseRowControllerReturn {
  const { file, mode, max, onLoadLines: onLoadMoreLines } = props
  const maxLines = max ?? DEFAULT_MAX_LINES

  const [hunkList, dispatch] = useReducer(
    hunkListReducer,
    { file: file, mode: mode, maxLinesToFetch: maxLines },
    ({ file, mode, maxLinesToFetch }) => new HunkListViewModel(file, mode, maxLinesToFetch),
  )

  useEffect(() => {
    dispatch({
      type: HunkListActionType.RESET,
      payload: { file: file, mode: mode, maxLinesToFetch: maxLines },
    })
  }, [file, mode, maxLines])

  const handleLoadLines = useCallback(
    async (line: LineMetadata, direction: HunkDirection) => {
      try {
        const ranges = hunkList.getLoadRange(line, direction)
        const result = await onLoadMoreLines?.({
          fileKey: file.key,
          leftRange: ranges.leftRange,
          rightRange: ranges.rightRange,
        })

        if (result) {
          dispatch({
            type: HunkListActionType.LOAD,
            payload: { line, result, direction },
          })
        }
      } catch (e: unknown) {
        notification.error({
          message: 'Error loading lines',
          description: `An error occurred while trying to load more lines. Please try again. ${String(e)}`,
          placement: 'topRight',
        })
      }
    },
    [dispatch, file.key, hunkList, onLoadMoreLines],
  )

  return {
    hunkList,
    handleLoadLines,
  }
}
