import { FileDiff } from '../../../shared/parsers/types'

export type DiffLineType = 'add' | 'delete' | 'context' | 'hunk' | 'empty'

export type Side = 'left' | 'right'

export interface FileViewerProps {
  /** A unique identifier for the file viewer. */
  id?: string
  /** The file diff object. */
  file: FileDiff
}

export interface UnifiedViewerProps {
  /** Flattened list of diff lines (already highlighted) */
  lines: LineWithHighlight[]
  /** Whether to wrap long lines or enable horizontal scrolling (defaults to true). */
  wrapLines?: boolean
  /** Whether the viewer is currently visible (for performance optimization) */
  visible?: boolean
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
