import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_CODE_PANEL_CONFIG, CodePanelConfigProvider } from '../../code-panel/providers/code-panel-context'
import { CodePanelConfig } from '../../code-panel/providers/types'
import {
  DEFAULT_FILE_EXPLORER_CONFIG,
  FileExplorerConfigProvider,
} from '../../file-explorer/provider/file-explorer-context'
import { FileExplorerConfig } from '../../file-explorer/types'
import { ThemeProvider } from '../../shared/providers/theme-context'
import { Themes, ThemeTokens } from '../../shared/themes'
import { DiffViewerConfigContextProps, DiffViewerConfigContextState } from './types'

/**
 * Keeps the configuration context for the DiffViewer component.
 */
export const DiffViewerConfigContext = createContext<DiffViewerConfigContextState | undefined>(undefined)

export const DiffViewerConfigProvider: React.FC<DiffViewerConfigContextProps> = ({
  children,
  theme: initialTheme,
  codePanelConfig: initialCodePanelConfig = DEFAULT_CODE_PANEL_CONFIG,
  fileExplorerConfig: initialFileExplorerConfig = DEFAULT_FILE_EXPLORER_CONFIG,
  storage = 'in-memory',
}) => {
  const STORAGE_KEY = '__diff_viewer_config__'

  // Hydrate from localStorage if requested
  const storedConfig = useMemo<{
    theme?: ThemeTokens
  } | null>(() => {
    if (storage !== 'local' || typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as {
        theme?: ThemeTokens
      }
    } catch {
      return null
    }
  }, [storage])

  const [theme, setTheme] = useState<ThemeTokens>(storedConfig?.theme ?? initialTheme)

  const [codePanelConfig, setCodePanelConfig] = useState<CodePanelConfig>(initialCodePanelConfig)
  const [fileExplorerConfig, setFileExplorerConfig] = useState<FileExplorerConfig>(initialFileExplorerConfig)

  const value = {
    codePanelConfig,
    fileExplorerConfig,
    theme,
    setCodePanelConfig,
    setFileExplorerConfig,
    setTheme,
  }

  useEffect(() => {
    if (storage !== 'local' || typeof window === 'undefined') return
    const serializable = {
      theme,
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
    } catch {
      // Ignore quota / serialization errors silently
    }
  }, [storage, theme])

  return (
    <ThemeProvider theme={theme ?? Themes.light}>
      <DiffViewerConfigContext.Provider value={value}>
        <FileExplorerConfigProvider config={fileExplorerConfig} storage={storage}>
          <CodePanelConfigProvider config={codePanelConfig} storage={storage}>
            {children}
          </CodePanelConfigProvider>
        </FileExplorerConfigProvider>
      </DiffViewerConfigContext.Provider>
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
