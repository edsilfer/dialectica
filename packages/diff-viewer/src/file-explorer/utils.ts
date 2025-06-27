import { FileDiff } from '../diff-viewer/types'
import { DirectoryNode, FileNode, TreeNode } from './types'

function collapse(node: DirectoryNode): DirectoryNode {
  if (node.children.size !== 1) {
    const newChildren = new Map<string, TreeNode>()
    for (const child of node.children.values()) {
      if (child.type === 'directory') {
        const collapsedChild = collapse(child)
        newChildren.set(collapsedChild.name, collapsedChild)
      } else {
        newChildren.set(child.name, child)
      }
    }
    node.children = newChildren
    return node
  }

  const child = node.children.values().next().value

  if (child?.type === 'directory') {
    const collapsedChild = collapse(child)
    collapsedChild.name = `${node.name}/${collapsedChild.name}`
    return collapsedChild
  }

  return node
}

/**
 * Builds a directory tree from the list of files inside the diff.
 *
 * @param files - The list of files to build the tree from.
 * @param collapsePackages - Whether to collapse single-child directories.
 * @returns     - The root directory node of the tree.
 */
export function buildTree(files: FileDiff[], collapsePackages?: boolean): DirectoryNode {
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

  if (collapsePackages) {
    const newChildren = new Map<string, TreeNode>()
    for (const child of root.children.values()) {
      if (child.type === 'directory') {
        const collapsed = collapse(child)
        newChildren.set(collapsed.name, collapsed)
      } else {
        newChildren.set(child.name, child)
      }
    }
    root.children = newChildren
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
