import { Interpolation, Theme } from '@emotion/react'
import { FileDiff } from '../../diff-viewer/types'
import { DirectoryNode, FileExplorerConfig, FileNode } from '../types'

export interface StyleParams {
  /** The nesting level of this node */
  level: number
  /** Configuration options for the file explorer */
  config: FileExplorerConfig
}

export interface FSNodeProps {
  /** The nesting level of this node */
  level: number
  /** Whether this node is the last in its parent directory */
  isLast: boolean
  /** The display name of the directory */
  displayName?: string
  /** Whether this node is selected */
  isSelected?: boolean
  /** Extra padding (in px) added to the default indentation */
  rowPaddingLeftExtra?: number
  /** Top offset (in px) for the vertical connector */
  verticalConnectorTop?: number
  /** Optional css-in-js style */
  css?: Interpolation<Theme>
  /** Optional class name */
  className?: string
  /** Optional metadata element to be rendered in the metadata container */
  metadata?: React.ReactNode
  /** Row content */
  children: React.ReactNode

  // Callbacks ____________________________________________
  /** Click handler for the row */
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
}

export interface DirNodeProps {
  /** The directory node to render */
  node: DirectoryNode
  /** The nesting level of this node */
  level: number
  /** Whether this node is the last in its parent directory */
  isLast: boolean
  /** The parent path for building the current path */
  parentPath: string
  /** Optional css-in-js style */
  css?: Interpolation<Theme>
  /** Optional class name */
  className?: string

  // Callbacks ____________________________________________
  /** Called when a file entry is clicked */
  onFileClick?: (file: FileDiff) => void
  /** Called when a directory entry is toggled */
  onDirectoryToggle?: (path: string, expanded: boolean) => void
}

export interface FileNodeProps {
  /** The file node to render */
  node: FileNode
  /** The nesting level of this node */
  level: number
  /** Whether this node is the last in its parent directory */
  isLast: boolean
  /** The parent path for building the current path */
  parentPath: string
  /** Optional css-in-js style */
  css?: Interpolation<Theme>
  /** Optional class name */
  className?: string

  // Callbacks ____________________________________________
  /** Called when the file entry is clicked */
  onFileClick?: (file: FileNode['file']) => void
}

export interface DirectoryNameProps {
  /** The number of files in the directory */
  fileCount: number
  /** Whether to show the file count */
  showDetails?: boolean
  /** The name of the directory */
  name: string
  /** The string to highlight in the directory name */
  highlightString?: string
  /** The full path of the directory for displaying in tooltips */
  fullPath: string
}
