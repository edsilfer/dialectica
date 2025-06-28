import { Interpolation, Theme } from '@emotion/react'
import { RefObject } from 'react'
import { DirectoryNode, FileNode, TreeNode } from '../types'

export interface FSNodeProps {
  /** Node to render */
  node: TreeNode
  /** Nesting level */
  level: number
  /** Parent path for building the current path */
  parentPath: string
  /** Optional css-in-js style */
  css?: Interpolation<Theme>
  /** Optional class name */
  className?: string

  // Callbacks ____________________________________________
  /** Called when a file entry is clicked */
  onFileClick?: (file: FileNode['file']) => void
  /** Called when a directory entry is toggled */
  onDirectoryToggle?: (path: string, expanded: boolean) => void
}

export interface NodeMetadataProps {
  /** Node to render */
  node: DirectoryNode | FileNode
  /** Whether the node is a directory */
  isDirectory: boolean
  /** Whether to show the icon */
  showIcons: boolean | undefined
  /** Whether to show the file count */
  displayDetails: boolean | undefined
}

export interface TreeSkeletonProps {
  /** The ref to the container element. */
  containerRef: RefObject<HTMLDivElement | null>
}

export interface Node {
  /** x coordinate of the node */
  cx: number
  /** y coordinate of the node */
  cy: number
  /** level of the node */
  level: number
  /** parent path of the node */
  parentPath: string
  /** path of the node */
  path: string
  /** type of the node */
  type: 'file' | 'directory'
  /** Whether the node is collapsed */
  collapsed: boolean
}

export interface LineSegment {
  /** x coordinate of the start of the line */
  x1: number
  /** y coordinate of the start of the line */
  y1: number
  /** x coordinate of the end of the line */
  x2: number
  /** y coordinate of the end of the line */
  y2: number
}
