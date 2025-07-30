import { FileDiff } from '../../../models/FileDiff'
import { LoadMoreLinesResult } from '../../../models/LineExtensions'
import { LineMetadata } from '../models/LineMetadata'
import { HunkListViewModel } from '../models/HunkListViewModel'
import { DisplayType, HunkDirection } from '../models/types'

export enum HunkListActionType {
  LOAD = 'LOAD',
  RESET = 'RESET',
}

type HunkListAction =
  | {
      type: HunkListActionType.LOAD
      payload: { line: LineMetadata; result: LoadMoreLinesResult; direction: HunkDirection }
    }
  | {
      type: HunkListActionType.RESET
      payload: { file: FileDiff; mode: DisplayType; maxLinesToFetch: number }
    }

/**
 * A reducer that mutates the view‑model through an explicit reducer.
 *
 * @param state   - the current state
 * @param action  - the action to perform
 * @returns       - the new state
 */
export function hunkListReducer(state: HunkListViewModel, action: HunkListAction): HunkListViewModel {
  if (action.type === HunkListActionType.LOAD) {
    const { line, result, direction } = action.payload
    return state.loadLines(line, result, direction)
  }

  if (action.type === HunkListActionType.RESET) {
    const { file, mode, maxLinesToFetch } = action.payload
    return new HunkListViewModel(file, mode, maxLinesToFetch)
  }

  return state
}
