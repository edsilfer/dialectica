import React, { createContext, useContext, useState } from 'react'
import { ThemeProvider } from '../../shared/providers/theme-context'
import { Themes } from '../../shared/themes'
import { FileExplorerConfig } from '../types'
import { FileExplorerConfigContextProps, FileExplorerConfigState } from './types'

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
const FileExplorerConfigContext = createContext<FileExplorerConfigState | undefined>(undefined)

export const FileExplorerConfigProvider: React.FC<FileExplorerConfigContextProps> = ({
  children,
  config: initialConfig = DEFAULT_FILE_EXPLORER_CONFIG,
}) => {
  const [config, setConfig] = useState<FileExplorerConfig>(initialConfig)

  const value = {
    config,
    setConfig,
  }

  return (
    <ThemeProvider theme={config.theme ?? Themes.light}>
      <FileExplorerConfigContext.Provider value={value}>
        {children}
      </FileExplorerConfigContext.Provider>
    </ThemeProvider>
  )
}

export const useFileExplorerConfig = (): FileExplorerConfigState => {
  const context = useContext(FileExplorerConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}
