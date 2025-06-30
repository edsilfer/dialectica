import React, { createContext, useContext, useState } from 'react'
import { DiffViewerThemeProvider } from '../../shared/providers/theme-provider'
import { Themes } from '../../shared/themes'
import { FileExplorerConfig } from '../types'
import { FileExplorerConfigContextProps, FileExplorerConfigState } from './types'

const DEFAULT_CONFIG: FileExplorerConfig = {
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
  config: initialConfig = DEFAULT_CONFIG,
}) => {
  const [config, setConfig] = useState<FileExplorerConfig>(initialConfig)

  const value = {
    config,
    setConfig,
  }

  return (
    <DiffViewerThemeProvider theme={config.theme ?? Themes.light}>
      <FileExplorerConfigContext.Provider value={value}>
        {children}
      </FileExplorerConfigContext.Provider>
    </DiffViewerThemeProvider>
  )
}

export const useFileExplorerConfig = (): FileExplorerConfigState => {
  const context = useContext(FileExplorerConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}
