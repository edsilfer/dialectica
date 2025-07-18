import { LoadMoreLinesHandler, Overlay, Widget, LineRange } from '../../diff-viewer/types'
import { FileDiff } from '../../../models/FileDiff'
import { DiffLineViewModel } from '../models/DiffLineViewModel'

export type DiffLineType = 'add' | 'delete' | 'context' | 'hunk' | 'empty'
export { Widget }
export type DisplayType = 'split' | 'unified'
export type Side = 'left' | 'right'
export type HunkDirection = 'up' | 'down' | 'out' | 'in' | 'in_up' | 'in_down'

export interface FileViewerProps {
  /** A unique identifier for the file viewer. */
  id?: string
  /** The file diff object. */
  file: FileDiff
  /** Number of lines to request when user clicks "load more". Defaults to 5. */
  maxLinesToFetch?: number
  /** Array of overlays to display on top of line columns when hovered. */
  overlays?: Overlay[]
  /** Array of widgets to display at specific line positions. */
  widgets?: Widget[]
  /** The line range to highlight. */
  highlightedLines?: LineRange

  /** Called when user requests to load (expand) more lines around a hunk. */
  onLoadMoreLines?: LoadMoreLinesHandler
}

export interface FileViewerHeaderProps {
  /* The file diff */
  file: FileDiff
  /* Whether the lines are wrapped */
  wrapLines: boolean
  /* Toggles the wrap lines state of the hunk list */
  onWrapLinesChange: (wrapLines: boolean) => void
}

export interface UnifiedViewerProps {
  /** Lines to display */
  lines: DiffLineViewModel[]
  /** The path of the file being displayed. */
  filepath: string
  /** Whether to wrap long lines or enable horizontal scrolling (defaults to true). */
  wrapLines?: boolean
  /** Whether the viewer is currently visible (for performance optimization) */
  visible?: boolean
  /** Number of lines to request when user clicks "load more". Defaults to 5. */
  loadMoreLinesCount?: number
  /** Array of overlays to display on top of line columns when hovered. */
  overlays?: Overlay[]
  /** Array of widgets to display at specific line positions. */
  widgets?: Widget[]
  /** The line range to highlight. */
  highlightedLines?: LineRange

  /** Called when user requests to load (expand) more lines around a hunk. */
  onLoadMoreLines?: (line: DiffLineViewModel, direction: HunkDirection) => void
}

export interface SplitViewerProps {
  /** Lines to display */
  lines: DiffLineViewModel[]
  /** The path of the file being displayed. */
  filepath: string
  /** Number of lines to request when user clicks "load more". Defaults to 5. */
  loadMoreLinesCount?: number
  /** Array of overlays to display on top of line columns when hovered. */
  overlays?: Overlay[]
  /** Array of widgets to display at specific line positions. */
  widgets?: Widget[]
  /** The line range to highlight. */
  highlightedLines?: LineRange

  /** Called when user requests to load (expand) more lines around a hunk. */
  onLoadMoreLines?: (line: DiffLineViewModel, direction: HunkDirection) => void
}
