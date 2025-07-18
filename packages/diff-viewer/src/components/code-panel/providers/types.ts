import React, { ReactNode } from 'react'
import { ThemeTokens } from '../../../themes'
import { DisplayType } from '../components/viewers/types'

export interface CodePanelConfigContextProps {
  /** The children of the diff viewer config provider */
  children: ReactNode
  /** The configuration for the diff viewer*/
  config?: CodePanelConfig
  /** Where the configuration should be stored. "in-memory" keeps the previous behaviour (default) and "local" persists values in localStorage */
  storage?: 'in-memory' | 'local'

  /** Set the configuration for the diff viewer */
  setConfig?: React.Dispatch<React.SetStateAction<CodePanelConfig>>
}

export interface FileState {
  /** Whether the file is currently collapsed */
  isCollapsed: boolean
  /** Whether the file has been marked as viewed */
  isViewed: boolean
}

export type PersistableState = {
  fileStates: Record<string, FileState>
  config: CodePanelConfig
}

export interface CodePanelConfigContextState {
  /** The configuration for the diff viewer */
  config: CodePanelConfig
  /** Map holding per-file UI state (collapsed / viewed) */
  fileStateMap: Map<string, FileState>
  /** List of all file keys (paths) currently present in the diff */
  allFileKeys: string[]

  /** Get the state of a file */
  getFileState: (fileKey: string) => FileState | undefined
  /** Mark a file as viewed or unviewed */
  setViewed: (fileKey: string, isViewed: boolean) => void
  /** Collapse or expand a file */
  setCollapsed: (fileKey: string, isCollapsed: boolean) => void
  /** Setter for the list of all file keys */
  setAllFileKeys: React.Dispatch<React.SetStateAction<string[]>>
  /** Set the configuration for the diff viewer */
  setConfig: React.Dispatch<React.SetStateAction<CodePanelConfig>>
}

/** Configuration options for how the diff should be displayed */
export interface CodePanelConfig {
  /** The theme for the viewer */
  theme?: ThemeTokens
  /** The mode to display the diff in. */
  mode: DisplayType
  /** Whether to ignore whitespace in the diff. */
  ignoreWhitespace?: boolean
  /** The maximum number of lines to display for a file. */
  maxFileLines?: number
}
