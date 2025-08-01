import { ThemeTokens } from '@edsilfer/commons'
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { FileMetadata } from '../models/FileMetadata'
import { DirectoryNode } from '../models/Nodes'
import { buildTree, listDirPaths } from '../utils/node-utils'
import { filterFiles, listExpandedDirs } from './context-utils'
import { useFileExplorerConfig } from './file-explorer-context'

// TYPES ----------------------------------------------------------------------------------------------
interface FSTreeContextProviderProps {
  /** The children of the file explorer provider */
  children: ReactNode
  /** The files to build the tree from */
  files: FileMetadata[]
}

export interface FSTreeContextState {
  /** The files to build the tree from */
  files: FileMetadata[]
  /** The configuration for the file explorer */
  config: FileExplorerConfig
  /** The string typed in the search input */
  searchQuery: string
  /** The selected node in the file explorer */
  selectedNode: string | null
  /** The expanded directories in the file explorer */
  expandedDirs: Set<string>
  /** The tree of files and directories */
  tree: DirectoryNode
  /** The filtered files based on the search query */
  filteredFiles: FileMetadata[]

  /** Set the search query that will be highlighted in the file explorer nodes */
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  /** Set the selected node in the file explorer */
  setSelectedNode: React.Dispatch<React.SetStateAction<string | null>>
  /** Set the expanded directories in the file explorer */
  setExpandedDirs: React.Dispatch<React.SetStateAction<Set<string>>>
}

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
  /** Whether to show file/folder icons. */
  showIcons?: boolean
  /** Whether to show file/folder details. */
  displayNodeDetails?: boolean
}

export interface FileExplorerConfigState {
  /** The configuration for the file explorer */
  config: FileExplorerConfig
  /** Set the configuration for the file explorer */
  setConfig: React.Dispatch<React.SetStateAction<FileExplorerConfig>>
}

const FSTreeContext = createContext<FSTreeContextState | undefined>(undefined)

// PROVIDER --------------------------------------------------------------------------------------------
export const FSTreeContextProvider: React.FC<FSTreeContextProviderProps> = ({ children, files }) => {
  const { config } = useFileExplorerConfig()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const filteredFiles = useMemo(() => filterFiles(files, searchQuery), [files, searchQuery])

  // Builds the tree that every component reads
  const tree = useMemo(
    () => buildTree(filteredFiles, config.collapsePackages),
    [filteredFiles, config.collapsePackages],
  )

  const [userExpandedDirs, setUserExpandedDirs] = useState<Set<string>>(() => {
    if (!config.startExpanded) return new Set<string>()
    const initialTree = buildTree(files, config.collapsePackages)
    return listDirPaths(initialTree)
  })

  useEffect(() => {
    if (config.startExpanded) {
      const initialTree = buildTree(files, config.collapsePackages)
      setUserExpandedDirs((prev) => {
        const validPrev = [...prev].filter((dir) => listDirPaths(initialTree).has(dir))
        return validPrev.length > 0 ? new Set(validPrev) : listDirPaths(initialTree)
      })
    } else {
      setUserExpandedDirs((prev) => {
        const initialTree = buildTree(files, config.collapsePackages)
        const validPrev = [...prev].filter((dir) => listDirPaths(initialTree).has(dir))
        return new Set(validPrev)
      })
    }
  }, [config.startExpanded, config.collapsePackages, files])

  const expandedDirs = useMemo(() => {
    if (!searchQuery) return userExpandedDirs
    const searchExpanded = listExpandedDirs(tree)
    return new Set([...userExpandedDirs, ...searchExpanded])
  }, [searchQuery, tree, userExpandedDirs])

  const value = {
    files,
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
