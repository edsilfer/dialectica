import { ThemeProvider, Themes, ThemeTokens } from '@commons'
import {
  DEFAULT_FILE_EXPLORER_CONFIG,
  FileExplorerConfig,
  FileExplorerConfigProvider,
  useFileExplorerConfig,
} from '@file-explorer'
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_FILE_LIST_CONFIG,
  FileListConfig,
  FileListConfigProvider,
  useFileListConfig,
} from './file-list-context'

// CONSTANTS --------------------------------------------------------------------------------------------
const STORAGE_KEY = '__diff_viewer_config__'

// TYPES ------------------------------------------------------------------------------------------------
export interface DiffViewerConfigContextProps {
  /** The children of the diff viewer config provider */
  children: ReactNode
  /** The theme to use for the diff viewer */
  theme: ThemeTokens
  /** The configuration for the code panel*/
  fileListConfig?: Omit<FileListConfig, 'theme'>
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

// CONTEXT ----------------------------------------------------------------------------------------------
export const DiffViewerConfigContext = createContext<DiffViewerThemeContextState | undefined>(undefined)

export const DiffViewerConfigProvider: React.FC<DiffViewerConfigContextProps> = (props) => {
  // Read the story config from local storage
  const storedConfig = useMemo<{ theme?: ThemeTokens } | null>(() => {
    if (props.storage !== 'local' || typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as {
        theme?: ThemeTokens
      }
    } catch {
      return null
    }
  }, [props.storage])

  const [theme, setTheme] = useState<ThemeTokens>(storedConfig?.theme ?? props.theme)
  const value: DiffViewerThemeContextState = { theme, setTheme }

  useEffect(() => {
    if (props.storage !== 'local' || typeof window === 'undefined') return
    const serializable = { theme }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
    } catch {
      // Ignore quota / serialization errors silently
    }
  }, [props.storage, theme])

  return (
    <ThemeProvider theme={theme ?? Themes.light}>
      <DiffViewerConfigContext.Provider value={value}>
        <FileExplorerConfigProvider
          config={{ ...DEFAULT_FILE_EXPLORER_CONFIG, ...props.fileExplorerConfig }}
          storage={props.storage}
        >
          <FileListConfigProvider
            config={{ ...DEFAULT_FILE_LIST_CONFIG, ...props.fileListConfig }}
            storage={props.storage}
          >
            {props.children}
          </FileListConfigProvider>
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
  let fileListConfig, setFileListConfig, fileExplorerConfig, setFileExplorerConfig

  try {
    const fileListCtx = useFileListConfig()
    fileListConfig = fileListCtx.config
    setFileListConfig = fileListCtx.setConfig
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
    fileListConfig,
    fileExplorerConfig,
    setFileListConfig,
    setFileExplorerConfig,
  }
}
