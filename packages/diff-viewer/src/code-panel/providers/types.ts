import React, { ReactNode } from 'react'
import { ThemeTokens } from '../../shared/themes/types'

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

export interface CodePanelConfigContextState {
  /** The configuration for the diff viewer */
  config: CodePanelConfig
  /** List of files that have been marked as viewed */
  viewedFiles: string[]
  /** List of files that are currently collapsed */
  collapsedFiles: string[]
  /** List of all file keys (paths) currently present in the diff */
  allFileKeys: string[]

  /** Setter for the list of viewed files */
  setViewedFiles: React.Dispatch<React.SetStateAction<string[]>>
  /** Setter for the list of collapsed files */
  setCollapsedFiles: React.Dispatch<React.SetStateAction<string[]>>
  /** Setter for the list of all file keys */
  setAllFileKeys: React.Dispatch<React.SetStateAction<string[]>>
  /** Set the configuration for the diff viewer */
  setConfig: React.Dispatch<React.SetStateAction<CodePanelConfig>>
}

export type DisplayFormat = 'unified' | 'split'

/** Configuration options for how the diff should be displayed */
export interface CodePanelConfig {
  /** The theme for the viewer */
  theme?: ThemeTokens
  /** The mode to display the diff in. */
  mode: DisplayFormat
  /** Whether to highlight the syntax of the diff. */
  highlightSyntax?: boolean
  /** Whether to show line numbers in the diff. */
  showLineNumbers?: boolean
  /** Whether to ignore whitespace in the diff. */
  ignoreWhitespace?: boolean
  /** The maximum number of lines to display for a file. */
  maxFileLines?: number
}
