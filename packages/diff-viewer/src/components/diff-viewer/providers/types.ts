import React, { ReactNode } from 'react'
import { CodePanelConfig } from '../../code-panel/providers/types'
import { FileExplorerConfig } from '../../file-explorer/types'
import { ThemeTokens } from '../../../themes'

export interface DiffViewerConfigContextProps {
  /** The children of the diff viewer config provider */
  children: ReactNode
  /** The theme to use for the diff viewer */
  theme: ThemeTokens
  /** The configuration for the code panel*/
  codePanelConfig?: Omit<CodePanelConfig, 'theme'>
  /** The configuration for the file explorer */
  fileExplorerConfig?: Omit<FileExplorerConfig, 'theme'>
  /** Where the configuration should be stored. "in-memory" keeps the previous behaviour (default) and "local" persists values in localStorage */
  storage?: 'in-memory' | 'local'
}

export interface DiffViewerThemeContextState {
  /** The currently selected theme tokens */
  theme: ThemeTokens

  /** Setter for the theme tokens */
  setTheme: React.Dispatch<React.SetStateAction<ThemeTokens>>
}
