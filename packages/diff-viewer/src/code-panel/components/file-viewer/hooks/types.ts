import { LoadMoreLinesHandler } from '../../../../main/types'
import { SourceCodeViewModel } from '../../source-code/models/SourceCodeViewModel'
import { HunkDirection, LinePair } from '../types'

export interface LoadLinesParams {
  /** The source code view model. */
  sourceCode: SourceCodeViewModel
  /** The file key. */
  fileKey: string
  /** The pivot line. */
  pivot: LinePair
  /** The direction to load more lines. */
  direction: HunkDirection
  /** The handler to fetch more lines. */
  handler: LoadMoreLinesHandler
}
