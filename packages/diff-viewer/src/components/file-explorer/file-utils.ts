import { FileDiff } from '../../types/diff'
import { DirectoryNode, FileNode, TreeNode } from './types'

/**
 * Builds a directory tree from the list of files inside the diff.
 *
 * @param files - The list of files to build the tree from.
 * @returns     - The root directory node of the tree.
 */
export function buildTree(files: FileDiff[]): DirectoryNode {
  const root: DirectoryNode = {
    type: 'directory',
    name: '',
    children: new Map(),
  }

  for (const file of files) {
    const fullPath = file.newPath || file.oldPath
    const parts = fullPath.split('/')

    let current: DirectoryNode = root

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      if (isLast) {
        // File node
        const fileNode: FileNode = { type: 'file', name: part, file }
        current.children.set(part, fileNode)
      } else {
        let child = current.children.get(part) as DirectoryNode | undefined
        if (!child) {
          child = { type: 'directory', name: part, children: new Map() }
          current.children.set(part, child)
        }
        current = child
      }
    })
  }

  return root
}

/**
 * Sorts nodes in the tree.
 *
 * @param a - The first node to compare.
 * @param b - The second node to compare.
 * @returns - The result of the comparison.
 */
export const sortNodes = (a: TreeNode, b: TreeNode) => {
  if (a.type === b.type) return a.name.localeCompare(b.name)
  return a.type === 'directory' ? -1 : 1
}
