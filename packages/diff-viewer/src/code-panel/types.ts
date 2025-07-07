import { Interpolation, Theme } from '@emotion/react'
import { LoadMoreLinesHandler } from '../main/types'
import { FileDiff } from '../shared/models/FileDiff'

export type FileListProps = {
  /** The files to display. */
  files: FileDiff[]
  /** The file to scroll to when the diff is loaded. */
  scrollTo?: string
  /** Whether the code panel is in a loading state. */
  isLoading?: boolean
  /** Kept to make typescript happy, but not used by emotion */
  css?: Interpolation<Theme>
  /** The content of css will be hashed and passed here */
  className?: string
  /** Number of lines to request when user clicks "load more". Defaults to 5. */
  maxLinesToFetch?: number

  /** Called when the user requests to load (expand) more lines for a specific file. */
  onLoadMoreLines?: LoadMoreLinesHandler
}
