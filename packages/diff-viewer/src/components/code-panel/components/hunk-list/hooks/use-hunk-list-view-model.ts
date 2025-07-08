import { useEffect, useReducer } from 'react'
import { FileDiff } from '../../../../../models/FileDiff'
import { LoadMoreLinesResult } from '../../../../diff-viewer/types'
import { HunkListViewModel } from '../models/HunkListViewModel'
import { LinePair } from '../models/LinePair'
import { HunkDirection } from '../types'
import { HunkListViewModelProps } from './types'

/*
 * README
 * ------
 * This hook manages the HunkList's state using a reducer (`useReducer`).
 *
 * - We use a reducer is used because the state logic is complex:
 *   - the next state is derived from the previous one when loading new lines
 * - This pattern is chosen over `useState` to centralize all update logic,
 * - This makes state transitions more predictable and easier to test.
 *
 * @returns the current state (`hunkList`) and a `dispatch` function to send actions
 */

type HunkListAction =
  | {
      type: 'lines_loaded'
      payload: { line: LinePair; result: LoadMoreLinesResult; direction: HunkDirection }
    }
  | {
      type: 'reset'
      payload: { file: FileDiff; mode: 'split' | 'unified'; maxLinesToFetch: number }
    }

function hunkListReducer(state: HunkListViewModel, action: HunkListAction): HunkListViewModel {
  switch (action.type) {
    case 'lines_loaded':
      return state.loadLines(action.payload.line, action.payload.result, action.payload.direction)
    case 'reset':
      return new HunkListViewModel(action.payload.file, action.payload.mode, action.payload.maxLinesToFetch ?? 10)
    default:
      return state
  }
}

export function useHunkListViewModel(props: HunkListViewModelProps) {
  const [hunkList, dispatch] = useReducer(
    hunkListReducer,
    { file: props.file, mode: props.mode, maxLinesToFetch: props.maxLinesToFetch ?? 10 },
    (initialArgs) => new HunkListViewModel(initialArgs.file, initialArgs.mode, initialArgs.maxLinesToFetch),
  )

  useEffect(() => {
    dispatch({
      type: 'reset',
      payload: { file: props.file, mode: props.mode, maxLinesToFetch: props.maxLinesToFetch ?? 10 },
    })
  }, [props.file, props.mode, props.maxLinesToFetch])

  return { hunkList, dispatch }
}
