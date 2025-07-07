import React from 'react'
import { ParsedDiff } from '../../models/ParsedDiff'
import { DrawerContent } from './drawer/types'

export interface LineRequest {
  /** The key/path of the file needing more lines */
  fileKey: string
  /** The starting line number to fetch (inclusive) */
  startLine: number
  /** The ending line number to fetch (inclusive) */
  endLine: number
}

export type LoadMoreLinesHandler = (request: LineRequest) => Promise<Map<number, string>>

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
