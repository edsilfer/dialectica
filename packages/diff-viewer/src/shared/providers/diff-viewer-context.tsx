import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
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
  storage = 'in-memory',
}) => {
  const STORAGE_KEY = '__diff_viewer_config__'

  // Hydrate from localStorage if requested
  const storedConfig = useMemo(() => {
    if (storage !== 'local' || typeof window === 'undefined') return null
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
    } catch {
      return null
    }
  }, [storage]) as {
    theme?: ThemeTokens
    codePanelConfig?: CodePanelConfig
    fileExplorerConfig?: FileExplorerConfig
  } | null

  const [theme, setTheme] = useState<ThemeTokens>(storedConfig?.theme ?? initialTheme)
  const [codePanelConfig, setCodePanelConfig] = useState<CodePanelConfig>(
    storedConfig?.codePanelConfig ?? initialCodePanelConfig,
  )
  const [fileExplorerConfig, setFileExplorerConfig] = useState<FileExplorerConfig>(
    storedConfig?.fileExplorerConfig ?? initialFileExplorerConfig,
  )

  const value = {
    codePanelConfig,
    fileExplorerConfig,
    theme,
    setCodePanelConfig,
    setFileExplorerConfig,
    setTheme,
  }

  // Persist changes whenever any part of the configuration changes
  useEffect(() => {
    if (storage !== 'local' || typeof window === 'undefined') return
    const serializable = {
      theme,
      codePanelConfig,
      fileExplorerConfig,
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
    } catch {
      // Ignore quota / serialization errors silently
    }
  }, [storage, theme, codePanelConfig, fileExplorerConfig])

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
