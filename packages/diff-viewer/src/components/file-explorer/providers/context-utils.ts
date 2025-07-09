import { FileDiff } from '../../../models/FileDiff'
import { DirectoryNode } from '../types'

/**
 * Filters the files based on the search query.
 *
 * @param files       - The files to filter.
 * @param searchQuery - The search query to filter the files by.
 * @returns           - The filtered files.
 */
export const filterFiles = (files: FileDiff[], searchQuery: string): FileDiff[] => {
  if (!searchQuery) {
    return files
  }

  const lowerCaseQuery = searchQuery.toLowerCase()

  return files.filter((file) => {
    const path = file.isDeleted ? file.oldPath : file.newPath
    return path.toLowerCase().includes(lowerCaseQuery)
  })
}

/**
 * Lists all the directory paths from the tree.
 *
 * @param tree - The tree to get the directory paths from.
 * @returns    - All the directory paths from the tree.
 */
export const listExpandedDirs = (tree: DirectoryNode): Set<string> => {
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
