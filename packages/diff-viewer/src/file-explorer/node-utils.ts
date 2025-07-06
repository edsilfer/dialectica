import React from 'react'
import { DirectoryNode, FileNode, TreeNode } from './types'
import { File } from '../shared/models/File'

/**
 * Builds a directory tree from the list of files inside the diff.
 *
 * @param files - The list of files to build the tree from.
 * @param collapsePackages - Whether to collapse single-child directories.
 * @returns     - The root directory node of the tree.
 */
export function buildTree(files: File[], collapsePackages?: boolean): DirectoryNode {
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
 * Collapses a directory node if it has only one child directory.
 *
 * @param node - The directory node to collapse.
 * @returns    - The collapsed directory node.
 */
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
 * Sorts nodes in the tree.
 *
 * @param a - The first node to compare.
 * @param b - The second node to compare.
 * @returns - The result of the comparison.
 */
export const nodeComparator = (a: TreeNode, b: TreeNode): number => {
  if (a.type === b.type) return a.name.localeCompare(b.name)
  return a.type === 'directory' ? -1 : 1
}

/**
 * Highlights occurrences of a search string within text by wrapping matches
 * in a span with the 'highlighted-text' class
 *
 * @param text      - The text to highlight.
 * @param highlight - The string to highlight.
 * @returns         - The highlighted text.
 */
export const highlightText = (text: string, highlight: string): React.ReactNode => {
  if (!highlight) return text

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (part.toLowerCase() === highlight.toLowerCase()) {
      return React.createElement('span', { key: index, className: 'highlighted-text' }, part)
    }
    return part
  })
}

/**
 * Recursively collects all files within a given directory node using a
 * Depth-First Search (DFS) traversal.
 *
 * @param dir - The directory node to start from.
 * @returns   - An array of all files within the directory.
 */
export function listFilesIn(dir: DirectoryNode): File[] {
  const files: File[] = []

  for (const childNode of dir.children.values()) {
    if (childNode.type === 'file') {
      files.push(childNode.file)
    } else if (childNode.type === 'directory') {
      files.push(...listFilesIn(childNode))
    }
  }

  return files
}

/**
 * Recursively collects all directory paths from a tree.
 *
 * @param tree - The root of the tree.
 * @returns    - A set of all directory paths.
 */
export function listDirPaths(tree: DirectoryNode): Set<string> {
  const dirs = new Set<string>()

  const collectDirs = (node: DirectoryNode, currentPath: string) => {
    if (currentPath) {
      dirs.add(currentPath)
    }

    node.children.forEach((child) => {
      if (child.type === 'directory') {
        const childPath = currentPath ? `${currentPath}/${child.name}` : child.name
        collectDirs(child, childPath)
      }
    })
  }

  collectDirs(tree, '')
  return dirs
}
