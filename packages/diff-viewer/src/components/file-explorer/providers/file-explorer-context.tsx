import { ThemeContext, ThemeProvider, Themes } from '@commons'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { FileExplorerConfig } from '../types'
import { FileExplorerConfigContextProps, FileExplorerConfigState } from './types'

const STORAGE_KEY = '__file_explorer_config__'
export const DEFAULT_FILE_EXPLORER_CONFIG: FileExplorerConfig = {
  startExpanded: true,
  nodeConnector: 'solid',
  indentPx: 16,
  collapsePackages: true,
  showIcons: false,
  displayNodeDetails: false,
}

/**
 * Keeps the configuration context for the FileExplorer component.
 */
export const FileExplorerConfigContext = createContext<FileExplorerConfigState | undefined>(undefined)

export const FileExplorerConfigProvider: React.FC<FileExplorerConfigContextProps> = ({
  children,
  config: initialConfig = DEFAULT_FILE_EXPLORER_CONFIG,
  storage = 'in-memory',
}) => {
  // Hydrate configuration from localStorage when requested
  const storedConfig = React.useMemo<FileExplorerConfig | null>(() => {
    if (storage !== 'local' || typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as FileExplorerConfig
    } catch {
      return null
    }
  }, [storage])

  const [config, setConfig] = useState<FileExplorerConfig>({ ...initialConfig, ...(storedConfig ?? {}) })

  // Keep internal config in sync with incoming prop changes but avoid clobbering
  // the initially hydrated (possibly persisted) state on the very first render.
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    // Merge new initialConfig with stored config, giving precedence to stored values
    setConfig({ ...initialConfig, ...storedConfig })
  }, [initialConfig, storedConfig])

  // Persist configuration whenever it changes
  useEffect(() => {
    if (storage !== 'local' || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch {
      /* Ignore quota / serialization errors silently */
    }
  }, [storage, config])

  const value = {
    config,
    setConfig,
  }

  // Check if a ThemeProvider is already present in the tree
  const inheritedTheme = useContext(ThemeContext)
  const themeToUse = config.theme ?? inheritedTheme ?? Themes.light
  const shouldProvideTheme = inheritedTheme === undefined
  const content = <FileExplorerConfigContext.Provider value={value}>{children}</FileExplorerConfigContext.Provider>
  return shouldProvideTheme ? <ThemeProvider theme={themeToUse}>{content}</ThemeProvider> : content
}

export const useFileExplorerConfig = (): FileExplorerConfigState => {
  const context = useContext(FileExplorerConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}
