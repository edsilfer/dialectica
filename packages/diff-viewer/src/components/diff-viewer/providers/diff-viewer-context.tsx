import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  CodePanelConfigProvider,
  DEFAULT_CODE_PANEL_CONFIG,
  useCodePanelConfig,
} from '../../code-panel/providers/code-panel-context'
import {
  DEFAULT_FILE_EXPLORER_CONFIG,
  FileExplorerConfigProvider,
  useFileExplorerConfig,
} from '../../file-explorer/provider/file-explorer-context'
import { ThemeProvider } from '../../../themes/providers/theme-context'
import { Themes, ThemeTokens } from '../../../themes'
import { DiffViewerConfigContextProps, DiffViewerThemeContextState } from './types'

/**
 * Keeps the configuration context for the DiffViewer component.
 */
export const DiffViewerConfigContext = createContext<DiffViewerThemeContextState | undefined>(undefined)

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

  const value: DiffViewerThemeContextState = {
    theme,
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
        <FileExplorerConfigProvider config={initialFileExplorerConfig} storage={storage}>
          <CodePanelConfigProvider config={initialCodePanelConfig} storage={storage}>
            {children}
          </CodePanelConfigProvider>
        </FileExplorerConfigProvider>
      </DiffViewerConfigContext.Provider>
    </ThemeProvider>
  )
}

export const useDiffViewerConfig = () => {
  const context = useContext(DiffViewerConfigContext)
  if (!context) {
    throw new Error('useDiffViewerConfig must be used within a ConfigProvider')
  }

  /*
   * Attempt to read configs from the specialized providers. These calls will
   * throw if the corresponding provider is missing – we guard against that so
   * `useDiffViewerConfig` continues to work even when the hook is used outside
   * of a CodePanel/FileExplorer provider (e.g. in fallback code paths).
   */
  let codePanelConfig, setCodePanelConfig, fileExplorerConfig, setFileExplorerConfig
  try {
    const codePanelCtx = useCodePanelConfig()
    codePanelConfig = codePanelCtx.config
    setCodePanelConfig = codePanelCtx.setConfig
  } catch {
    // noop – keep undefined so consumers can handle the absence
  }

  try {
    const fileExplorerCtx = useFileExplorerConfig()
    fileExplorerConfig = fileExplorerCtx.config
    setFileExplorerConfig = fileExplorerCtx.setConfig
  } catch {
    // noop
  }

  return {
    ...context,
    codePanelConfig,
    setCodePanelConfig,
    fileExplorerConfig,
    setFileExplorerConfig,
  }
}
