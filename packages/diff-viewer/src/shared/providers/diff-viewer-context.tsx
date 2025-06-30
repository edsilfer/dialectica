import React, { createContext, useContext, useState } from 'react'
import { DEFAULT_CODE_PANEL_CONFIG } from '../../code-panel/providers/code-panel-context'
import { CodePanelConfig } from '../../code-panel/providers/types'
import { DEFAULT_FILE_EXPLORER_CONFIG } from '../../file-explorer/provider/file-explorer-context'
import { FileExplorerConfig } from '../../file-explorer/types'
import { Themes } from '../themes'
import { ThemeProvider } from './theme-context'
import { ThemeTokens } from '../themes/types'
import { DiffViewerConfigContextProps, DiffViewerConfigContextState } from './types'

/**
 * Keeps the configuration context for the DiffViewer component.
 */
const DiffViewerConfigContext = createContext<DiffViewerConfigContextState | undefined>(undefined)

export const DiffViewerConfigProvider: React.FC<DiffViewerConfigContextProps> = ({
  children,
  theme: initialTheme,
  codePanelConfig: initialCodePanelConfig = DEFAULT_CODE_PANEL_CONFIG,
  fileExplorerConfig: initialFileExplorerConfig = DEFAULT_FILE_EXPLORER_CONFIG,
}) => {
  const [theme, setTheme] = useState<ThemeTokens>(initialTheme)
  const [codePanelConfig, setCodePanelConfig] = useState<CodePanelConfig>(initialCodePanelConfig)
  const [fileExplorerConfig, setFileExplorerConfig] =
    useState<FileExplorerConfig>(initialFileExplorerConfig)

  const value = {
    codePanelConfig,
    fileExplorerConfig,
    theme,
    setCodePanelConfig,
    setFileExplorerConfig,
    setTheme,
  }

  return (
    <ThemeProvider theme={theme ?? Themes.light}>
      <DiffViewerConfigContext.Provider value={value}>{children}</DiffViewerConfigContext.Provider>
    </ThemeProvider>
  )
}

export const useDiffViewerConfig = (): DiffViewerConfigContextState => {
  const context = useContext(DiffViewerConfigContext)
  if (!context) {
    throw new Error('useDiffViewerConfig must be used within a ConfigProvider')
  }
  return context
}
