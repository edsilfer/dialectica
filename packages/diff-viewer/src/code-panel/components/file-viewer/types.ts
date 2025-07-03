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
  lines: LinePair[]
  /** Whether to wrap long lines or enable horizontal scrolling (defaults to true). */
  wrapLines?: boolean
  /** Whether the viewer is currently visible (for performance optimization) */
  visible?: boolean
}

/**
 * - For the unified viewer only the "left" fields are populated
 *   (the right side stays `null` so renderers can safely ignore it)
 * - For the split viewer both the left and right sides may be populated.
 */
export interface LinePair {
  /** Left-hand side information (original file). */
  typeLeft: DiffLineType | null
  /** The content of the line */
  contentLeft: string | null
  /** The highlighted content of the line */
  highlightedContentLeft: string | null
  /** The line number of the left side of the hunk. If null, the line number is not shown. */
  lineNumberLeft: number | null

  /** Right-hand side information (modified file). */
  typeRight: DiffLineType | null
  /** The content of the line */
  contentRight: string | null
  /** The highlighted content of the line */
  highlightedContentRight: string | null
  /** The line number of the right side of the hunk. If null, the line number is not shown. */
  lineNumberRight: number | null
}
