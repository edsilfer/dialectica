import React, { createContext, useContext, useState, useMemo } from 'react'
import { FileExplorerConfig } from '../types'
import { ParsedDiff } from '../../diff-viewer/types'
import { buildTree, getAllDirPaths } from '../utils'
import { FileExplorerContextState, FileExplorerProviderProps } from './types'
import { filterFiles, listExpandedDirs } from './utils'

export const FileExplorerContext = createContext<FileExplorerContextState | undefined>(undefined)

export const FileExplorerProvider: React.FC<FileExplorerProviderProps> = ({
  children,
  diff: initialDiff,
  config: initialConfig,
}) => {
  const [diff] = useState<ParsedDiff>(initialDiff)
  const [config] = useState<FileExplorerConfig>(initialConfig)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const filteredFiles = useMemo(
    () => filterFiles(diff.files, searchQuery),
    [diff.files, searchQuery],
  )

  const tree = useMemo(
    () => buildTree(filteredFiles, config.collapsePackages),
    [filteredFiles, config.collapsePackages],
  )

  const [userExpandedDirs, setUserExpandedDirs] = useState<Set<string>>(() => {
    if (!initialConfig.startExpanded) return new Set<string>()
    const initialTree = buildTree(initialDiff.files, initialConfig.collapsePackages)
    return getAllDirPaths(initialTree)
  })

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

  return <FileExplorerContext.Provider value={value}>{children}</FileExplorerContext.Provider>
}

export const useFileExplorerContext = () => {
  const context = useContext(FileExplorerContext)
  if (!context) {
    throw new Error('useFileExplorerContext must be used within a FileExplorerProvider')
  }
  return context
}
