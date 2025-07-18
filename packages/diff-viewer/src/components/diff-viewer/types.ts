import React from 'react'
import { ParsedDiff } from '../../models/ParsedDiff'
import { DrawerContent } from './components/types'

export interface Range {
  /* The start of the range, always smaller than end */
  start: number
  /* The end of the range, always larger than start */
  end: number
}

export interface LineMetadata {
  /** The line number of the line that the overlay is docked to */
  lineNumber: number | undefined
  /** The side of the line that the overlay is docked to */
  side: 'left' | 'right' | undefined
  /** The content of the line that the overlay is docked to */
  content: string | undefined
  /** The path of the file that the line belongs to */
  filepath: string | undefined
}

/**
 * An overlay is content to be displayed on top of the line column when the line is hovered.
 */
export interface Overlay {
  /** Custom React component to be displayed as overlay content */
  content: React.ReactNode
  /** Index of the line col for unified view. Examples: left/right line number, and code */
  unifiedDockIdx: 0 | 1 | 2
  /** Index of the line col for split view. Examples: line number, and code */
  splitDockIdx: 0 | 1
  /** Callback that gets called when the overlay is docked to a line */
  onDock?: (metadata: LineMetadata) => void
}

/**
 * A widget is content to be displayed at a specific line position.
 */
export interface Widget {
  /** Custom React component to be displayed as widget content */
  content: React.ReactNode
  /** The line number where the widget should be positioned */
  line: number
  /** The position of the widget relative to the line */
  position: 'top' | 'bottom'
  /** The filepath where the widget should be displayed */
  filepath: string
  /** The side where the widget should be positioned (for split view) */
  side: 'left' | 'right'
}

export interface LineRequest {
  /** The key/path of the file needing more lines */
  fileKey: string
  /** The range of lines to fetch from the left side (base/old file version) */
  leftRange: Range
  /** The range of lines to fetch from the right side (head/new file version) */
  rightRange: Range
}

export interface LoadMoreLinesResult {
  /** Lines from the old file version (base/left side) */
  leftLines: Map<number, string>
  /** Lines from the new file version (head/right side) */
  rightLines: Map<number, string>
}

export type LoadMoreLinesHandler = (request: LineRequest) => Promise<LoadMoreLinesResult>

export interface LineRange {
  side: 'left' | 'right'
  start: number
  end: number
  filepath: string
}

export interface DiffViewerProps {
  /** The parsed diff to visualize. */
  diff: ParsedDiff
  /** Whether the metadata (header information, file list, etc.) is still loading. */
  isMetadataLoading?: boolean
  /** Whether the diff (file content changes) is still loading. */
  isDiffLoading?: boolean
  /** Whether to show the file explorer panel. Defaults to true. */
  enableFileExplorer?: boolean
  /** Additional drawer contents to be displayed alongside the built-in file explorer. */
  additionalDrawerContents?: DrawerContent[]
  /** Custom toolbar component. If not provided, defaults to the built-in toolbar. */
  toolbar?: React.ReactNode
  /** Number of lines to request when user clicks "load more". Defaults to 5. */
  maxLinesToFetch?: number
  /** Array of overlays to display on top of line columns when hovered. */
  overlays?: Overlay[]
  /** Array of widgets to display at specific line positions. */
  widgets?: Widget[]
  /** The line number to highlight. */
  highlightedLines?: LineRange

  /** Called when the user requests to load (expand) more lines for a specific file. */
  onLoadMoreLines?: LoadMoreLinesHandler
  /** Called when the user selects a line range. */
  onLineSelection?: (lineRange: LineRange) => void
}
