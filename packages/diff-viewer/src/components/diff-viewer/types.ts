import React from 'react'
import { ParsedDiff } from '../../models/ParsedDiff'
import { DrawerContent } from './drawer/types'

export interface Range {
  /* The start of the range, always smaller than end */
  start: number
  /* The end of the range, always larger than start */
  end: number
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

  /** Called when the user requests to load (expand) more lines for a specific file. */
  onLoadMoreLines?: LoadMoreLinesHandler
}
