import { Interpolation, Theme } from '@emotion/react'
import { LoadMoreLinesHandler } from '../main/types'
import { ParsedDiff } from '../shared/models/ParsedDiff'
import { DiffLine } from '../shared/models/Line'

export type CodePanelProps = {
  /** The parsed diff to display. */
  diff: ParsedDiff
  /** The file to scroll to when the diff is loaded. */
  scrollTo?: string | null
  /** Whether the code panel is in a loading state. */
  loading?: boolean
  /** Kept to make typescript happy, but not used by emotion */
  css?: Interpolation<Theme>
  /** The content of css will be hashed and passed here */
  className?: string
  /** Number of lines to request when user clicks "load more". Defaults to 5. */
  maxLinesToFetch?: number

  // Callbacks ____________________________________________
  /** Callback for when a line is clicked. */
  onLineClick?: (line: DiffLine) => void
  /** Called when the user requests to load (expand) more lines for a specific file. */
  onLoadMoreLines?: LoadMoreLinesHandler
}
