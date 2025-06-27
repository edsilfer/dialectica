import { FileDiff } from '../diff-viewer/types'

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
