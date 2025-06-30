import { ReactNode } from 'react'
import { ThemeTokens } from '../../shared/themes/types'

export interface DiffViewerConfigContextProps {
  /** The children of the diff viewer config provider */
  children: ReactNode
  /** The configuration for the diff viewer*/
  config?: DiffViewerConfig

  /** Set the configuration for the diff viewer */
  setConfig?: React.Dispatch<React.SetStateAction<DiffViewerConfig>>
}

export interface DiffViewerConfigContextState {
  /** The configuration for the diff viewer */
  config: DiffViewerConfig

  /** Set the configuration for the diff viewer */
  setConfig: React.Dispatch<React.SetStateAction<DiffViewerConfig>>
}

export type DisplayFormat = 'unified' | 'split'

/** Configuration options for how the diff should be displayed */
export interface DiffViewerConfig {
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
  /** Whether to wrap lines in the diff. */
  wrapLines?: boolean
  /** The maximum number of lines to display for a file. */
  maxFileLines?: number
}
