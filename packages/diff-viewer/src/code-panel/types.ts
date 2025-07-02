import { Interpolation, Theme } from '@emotion/react'
import { DiffLine, ParsedDiff } from '../shared/parsers/types'

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

  // Callbacks ____________________________________________
  /** Callback for when a line is clicked. */
  onLineClick?: (line: DiffLine) => void
}
