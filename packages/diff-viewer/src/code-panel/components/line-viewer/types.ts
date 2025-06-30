export type DiffLineType = 'add' | 'delete' | 'context' | 'hunk' | 'empty'

export type Side = 'left' | 'right'

/**
 * Diff line augmented with a pre-computed syntax-highlighted HTML string.
 */
export interface LineWithHighlight {
  /** The type of the line */
  type: DiffLineType
  /** The content of the line */
  content: string
  /** The highlighted content of the line */
  highlightedContent: string
  /** The line number of the left side of the hunk. If null, the line number is not shown. */
  lineNumberOld: number | null
  /** The line number of the right side of the hunk. If null, the line number is not shown. */
  lineNumberNew: number | null
}

export interface DiffLineProps {
  /** The line number of the left side of the hunk. If null, the line number is not shown. */
  leftNumber: number | null
  /** The line number of the right side of the hunk. If null, the line number is not shown. */
  rightNumber: number | null
  /** The content of the line */
  content: string
  /** Whether to show the line numbers */
  showNumber: boolean
  /** The type of the line */
  type: DiffLineType
  /** Whether to hide the left number column entirely */
  hideLeftNumber?: boolean
  /** Whether to hide the right number column entirely */
  hideRightNumber?: boolean
  /** The view type */
  view?: 'split' | 'unified'
  /** Whether to wrap long lines or enable horizontal scrolling (defaults to true) */
  wrapLines?: boolean

  /** The function to call when the add button is clicked */
  onAddButtonClick: () => void

  /** Pre-computed left offsets (in px) for sticky columns */
  stickyOffsets?: {
    rightNumber: number
    prefix: number
  }
}
