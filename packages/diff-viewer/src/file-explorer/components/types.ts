import { Interpolation, Theme } from '@emotion/react'
import { FileDiff } from '../../diff-viewer/types'
import { DirectoryNode, FileExplorerConfig, FileNode } from '../types'

export interface StyleParams {
  /** The nesting level of this node */
  level: number
  /** Configuration options for the file explorer */
  config: FileExplorerConfig
}

export interface DirNodeProps {
  /** Configuration options for the file explorer */
  config: FileExplorerConfig
  /** The directory node to render */
  node: DirectoryNode
  /** The nesting level of this node */
  level: number
  /** Whether this node is the last in its parent directory */
  isLast: boolean
  /** The parent path for building the current path */
  parentPath: string
  /** Whether the parent directory is expanded */
  expandedDirs: Set<string>
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

export interface DirRowProps {
  /** The current path of the directory */
  currentPath: string
  /** Whether the directory is collapsed */
  collapsed: boolean
  /** The nesting level of this node */
  level: number
  /** Whether this node is the last in its parent directory */
  isLast: boolean
  /** The display name of the directory */
  displayName: string
  /** Configuration options for the file explorer */
  config: FileExplorerConfig

  // Callbacks ____________________________________________
  /** Optional css-in-js style */
  cssProp?: Interpolation<Theme>
  /** Optional class name */
  className?: string
  /** Called when a directory entry is toggled */
  onDirectoryToggle?: (path: string, collapsed: boolean) => void
}

export interface FileNodeProps {
  /** Configuration options for the file explorer */
  config: FileExplorerConfig
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
