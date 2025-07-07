import { FileDiff } from '../../../../shared/models/FileDiff'

export interface HunkListViewModelProps {
  /** The file to display */
  file: FileDiff
  /** The display mode */
  mode: 'split' | 'unified'
  /** The maximum number of lines to fetch */
  maxLinesToFetch: number
}
