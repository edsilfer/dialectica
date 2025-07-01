import { FileDiff } from '../../../shared/parsers/types'
import { LineWithHighlight } from '../line-viewer/types'

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

export interface SplitLineViewerProps {
  /** Pre-built left/right line pairs ready for rendering */
  pairs: SplitLinePair[]
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
