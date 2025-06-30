import React from 'react'
import { ReactNode } from 'react'
import { ParsedDiff } from '../../shared/parsers/types'
import { DirectoryNode, FileExplorerConfig } from '../types'

export interface FileExplorerConfigContextProps {
  /** The children of the file explorer config provider */
  children: ReactNode
  /** The configuration for the file explorer */
  config?: FileExplorerConfig
  /** Set the configuration for the file explorer */
  setConfig?: React.Dispatch<React.SetStateAction<FileExplorerConfig>>
}

export interface FileExplorerConfigState {
  /** The configuration for the file explorer */
  config: FileExplorerConfig

  /** Set the configuration for the file explorer */
  setConfig: React.Dispatch<React.SetStateAction<FileExplorerConfig>>
}

export interface FSTreeContextProviderProps {
  /** The children of the file explorer provider */
  children: ReactNode
  /** The parsed diff */
  diff: ParsedDiff
}

export interface FSTreeContextState {
  /** The parsed diff */
  diff: ParsedDiff
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
  filteredFiles: ParsedDiff['files']

  // Setters _______________________________________________________
  /** Set the search query that will be highlighted in the file explorer nodes */
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  /** Set the selected node in the file explorer */
  setSelectedNode: React.Dispatch<React.SetStateAction<string | null>>
  /** Set the expanded directories in the file explorer */
  setExpandedDirs: React.Dispatch<React.SetStateAction<Set<string>>>
}
