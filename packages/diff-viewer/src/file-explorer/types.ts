import { Interpolation } from '@emotion/react'
import { FileDiff, ParsedDiff } from '../diff-viewer/types'
import { ThemeTokens } from '../shared/themes'
import { Theme } from '@emotion/react'

export interface FileExplorerProps {
  /** Parsed diff used to build the tree */
  diff: ParsedDiff
  /** Configuration options for the file explorer */
  config?: FileExplorerConfig
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

export interface DirectoryNode {
  /** The type of the node, which is 'directory' for directories. */
  type: 'directory'
  /** The name of the directory. */
  name: string
  /** A map of child name -> node. */
  children: Map<string, TreeNode>
}

export interface FileNode {
  /** The type of the node, which is 'file' for files. */
  type: 'file'
  /** The name of the file. */
  name: string
  /** The file object. */
  file: FileDiff
}

export type TreeNode = DirectoryNode | FileNode

export interface FileExplorerConfig {
  /** The theme for the viewer */
  theme?: ThemeTokens
  /** The initial expanded directories. */
  startExpanded?: boolean
  /** The connector style between nodes. */
  nodeConnector?: 'solid' | 'dashed' | 'none'
  /** Whether to round the connectors. */
  roundedConnectors?: boolean
  /** The indentation of the nodes. */
  indentPx: number
  /** Whether to collapse the packages. */
  collapsePackages?: boolean
}
