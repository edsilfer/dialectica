import { FileDiff } from '../../parsers/types'

export interface DiffActivitySummaryProps {
  /** The number of additions */
  additions: number
  /** The number of deletions */
  deletions: number
  /** The maximum number of squares to display. Defaults to 5. */
  maxSquares?: number
}

export interface DirectoryActivitySummaryProps {
  /** The file diff object */
  files: FileDiff[]
  /** The maximum number of squares to display. Defaults to 10. */
  maxSquares?: number
}

export interface FileActivitySummaryProps {
  /** The file diff object */
  file: FileDiff
  /** The maximum number of squares to display. Defaults to 10. */
  maxSquares?: number
}
