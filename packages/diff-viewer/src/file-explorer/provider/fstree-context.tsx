import React, { createContext, useContext, useState, useMemo, useEffect } from 'react'
import { buildTree, listDirPaths } from '../node-utils'
import { FSTreeContextState, FSTreeContextProviderProps } from './types'
import { filterFiles, listExpandedDirs } from './context-utils'
import { useFileExplorerConfig } from './file-explorer-context'

export const FSTreeContext = createContext<FSTreeContextState | undefined>(undefined)

export const FSTreeContextProvider: React.FC<FSTreeContextProviderProps> = ({ children, diff }) => {
  const { config } = useFileExplorerConfig()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const filteredFiles = useMemo(
    () => filterFiles(diff.files, searchQuery),
    [diff.files, searchQuery],
  )

  // Builds the tree that every component reads
  const tree = useMemo(
    () => buildTree(filteredFiles, config.collapsePackages),
    [filteredFiles, config.collapsePackages],
  )

  const [userExpandedDirs, setUserExpandedDirs] = useState<Set<string>>(() => {
    if (!config.startExpanded) return new Set<string>()
    const initialTree = buildTree(diff.files, config.collapsePackages)
    return listDirPaths(initialTree)
  })

  useEffect(() => {
    if (config.startExpanded) {
      const initialTree = buildTree(diff.files, config.collapsePackages)
      setUserExpandedDirs((prev) => {
        const validPrev = [...prev].filter((dir) => listDirPaths(initialTree).has(dir))
        return validPrev.length > 0 ? new Set(validPrev) : listDirPaths(initialTree)
      })
    } else {
      setUserExpandedDirs((prev) => {
        const initialTree = buildTree(diff.files, config.collapsePackages)
        const validPrev = [...prev].filter((dir) => listDirPaths(initialTree).has(dir))
        return new Set(validPrev)
      })
    }
  }, [config.startExpanded, config.collapsePackages, diff.files])

  const expandedDirs = useMemo(() => {
    if (!searchQuery) return userExpandedDirs
    const searchExpanded = listExpandedDirs(tree)
    return new Set([...userExpandedDirs, ...searchExpanded])
  }, [searchQuery, tree, userExpandedDirs])

  const value = {
    diff,
    config,
    searchQuery,
    selectedNode,
    expandedDirs,
    setSearchQuery,
    setSelectedNode,
    setExpandedDirs: setUserExpandedDirs,
    tree,
    filteredFiles,
  }

  return <FSTreeContext.Provider value={value}>{children}</FSTreeContext.Provider>
}

export const useFileExplorerContext = () => {
  const context = useContext(FSTreeContext)
  if (!context) {
    throw new Error('useFileExplorerContext must be used within a FileExplorerProvider')
  }
  return context
}
