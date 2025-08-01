import { ThemeProvider, Themes, ThemeTokens } from '@edsilfer/commons'
import {
  DEFAULT_FILE_EXPLORER_CONFIG,
  FileExplorerConfig,
  FileExplorerConfigProvider,
  useFileExplorerConfig,
} from '@edsilfer/file-explorer'
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_FILE_LIST_CONFIG,
  FileListConfig,
  FileListConfigProvider,
  useFileListConfig,
} from './file-list-context'

// CONSTANTS --------------------------------------------------------------------------------------------
const STORAGE_KEY = '__diff_viewer_config__'

// Default values
export const DEFAULT_DIFF_VIEWER_CONFIG: DiffViewerConfig = {
  /** The theme to use for the diff viewer */
  theme: Themes.light,
  /** The size of the handle in pixels */
  handleSize: 14,
  /** The initial width of the file explorer in percentage of the parent container */
  explorerInitialWidth: 25,
  /** The minimum width of the file explorer in percentage of the parent container */
  explorerMinWidth: 10,
  /** The maximum width of the file explorer in percentage of the parent container */
  explorerMaxWidth: 50,
}

// TYPES ------------------------------------------------------------------------------------------------
export interface DiffViewerConfig {
  /** The theme to use for the diff viewer */
  theme: ThemeTokens
  /** The size of the handle in pixels */
  handleSize: number
  /** The initial width of the file explorer */
  explorerInitialWidth: number
  /** The minimum width of the file explorer in percentage of the parent container */
  explorerMinWidth: number
  /** The maximum width of the file explorer in percentage of the parent container */
  explorerMaxWidth: number
}

export interface DiffViewerConfigContextProps {
  /** The children of the diff viewer config provider */
  children: ReactNode
  /** The configuration for the diff viewer */
  config?: DiffViewerConfig
  /** The configuration for the code panel*/
  fileListConfig?: Omit<FileListConfig, 'theme'>
  /** The configuration for the file explorer */
  fileExplorerConfig?: Omit<FileExplorerConfig, 'theme'>
  /** Where the configuration should be stored. "in-memory" keeps the previous behaviour (default) and "local" persists values in localStorage */
  storage?: 'in-memory' | 'local'
  /** A suffix to append to the storage key */
  scope?: string
  /** Set the configuration for the diff viewer */
  setConfig?: React.Dispatch<React.SetStateAction<DiffViewerConfig>>
}

export interface DiffViewerConfigContextState {
  /** The configuration for the diff viewer */
  config: DiffViewerConfig
  /** Setter for the configuration */
  setConfig: React.Dispatch<React.SetStateAction<DiffViewerConfig>>
}

// CONTEXT ----------------------------------------------------------------------------------------------
export const DiffViewerConfigContext = createContext<DiffViewerConfigContextState | undefined>(undefined)

export const DiffViewerConfigProvider: React.FC<DiffViewerConfigContextProps> = (props) => {
  const { children, config: externalConfig = DEFAULT_DIFF_VIEWER_CONFIG, storage = 'in-memory' } = props

  // Read the config from local storage
  const storedConfig = useMemo<DiffViewerConfig | null>(() => {
    if (storage !== 'local' || typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY + (props.scope ?? ''))
      if (!raw) return null
      return JSON.parse(raw) as DiffViewerConfig
    } catch {
      return null
    }
  }, [storage, props.scope])

  const [config, setConfig] = useState<DiffViewerConfig>({ ...externalConfig, ...(storedConfig ?? {}) })

  // Keep internal config in sync with incoming prop changes but avoid clobbering
  // the initially hydrated (possibly persisted) state on the very first render.
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    // Merge new externalConfig with stored config, giving precedence to stored values
    setConfig({ ...externalConfig, ...storedConfig })
  }, [externalConfig, storedConfig])

  // Persist configuration whenever it changes
  useEffect(() => {
    if (storage !== 'local' || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch {
      // Ignore quota / serialization errors silently
    }
  }, [storage, config])

  const value: DiffViewerConfigContextState = { config, setConfig }

  return (
    <ThemeProvider theme={config.theme}>
      <DiffViewerConfigContext.Provider value={value}>
        <FileExplorerConfigProvider
          config={{ ...DEFAULT_FILE_EXPLORER_CONFIG, ...props.fileExplorerConfig }}
          storage={props.storage}
        >
          <FileListConfigProvider
            config={{ ...DEFAULT_FILE_LIST_CONFIG, ...props.fileListConfig }}
            storage={props.storage}
          >
            {children}
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
