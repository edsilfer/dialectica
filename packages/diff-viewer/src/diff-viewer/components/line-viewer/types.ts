import { DisplayConfig, Hunk } from '../../types'

export type DiffLineType = 'add' | 'delete' | 'context' | 'hunk'

/**
 * Shared props for both UnifiedHunkViewer and SplitHunkViewer.
 */
export interface HunkViewerProps {
  /** The hunk to display */
  hunk: Hunk
  /** Display configuration options */
  config: DisplayConfig
  /** Detected language for syntax highlighting */
  language: string
}

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

/**
 * Represents a single visual row in a split diff – the left and right halves.
 */
export interface SplitLinePair {
  /** The left side of the line pair */
  left: LineWithHighlight | null
  /** The right side of the line pair */
  right: LineWithHighlight | null
}

export interface UnifiedViewerProps {
  /** Flattened list of diff lines (already highlighted) */
  lines: LineWithHighlight[]
  /** Display options */
  config: DisplayConfig
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

  /** The function to call when the add button is clicked */
  onAddButtonClick: () => void
}
