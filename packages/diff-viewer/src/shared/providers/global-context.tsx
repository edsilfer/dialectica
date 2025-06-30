import React, { createContext, useContext, useState } from 'react'
import { DEFAULT_DIFF_VIEWER_CONFIG } from '../../diff-viewer/providers/diff-viewer-context'
import { DiffViewerConfig } from '../../diff-viewer/providers/types'
import { DEFAULT_FILE_EXPLORER_CONFIG } from '../../file-explorer/provider/file-explorer-context'
import { FileExplorerConfig } from '../../file-explorer/types'
import { ThemeProvider } from '../../shared/providers/theme-context'
import { Themes } from '../../shared/themes'
import { DiffViewerGlobalConfigContextProps, DiffViewerGlobalConfigContextState } from './types'

/**
 * Keeps the configuration context for the DiffViewer component.
 */
const DiffViewerGlobalConfigContext = createContext<DiffViewerGlobalConfigContextState | undefined>(
  undefined,
)

export const DiffViewerGlobalConfigProvider: React.FC<DiffViewerGlobalConfigContextProps> = ({
  children,
  theme,
  diffViewerConfig: initialDiffViewerConfig = DEFAULT_DIFF_VIEWER_CONFIG,
  fileExplorerConfig: initialFileExplorerConfig = DEFAULT_FILE_EXPLORER_CONFIG,
}) => {
  const [diffViewerConfig, setDiffViewerConfig] =
    useState<DiffViewerConfig>(initialDiffViewerConfig)
  const [fileExplorerConfig, setFileExplorerConfig] =
    useState<FileExplorerConfig>(initialFileExplorerConfig)

  const value = {
    diffViewerConfig,
    fileExplorerConfig,
    setDiffViewerConfig,
    setFileExplorerConfig,
  }

  return (
    <ThemeProvider theme={theme ?? Themes.light}>
      <DiffViewerGlobalConfigContext.Provider value={value}>
        {children}
      </DiffViewerGlobalConfigContext.Provider>
    </ThemeProvider>
  )
}

export const useDiffViewerGlobalConfig = (): DiffViewerGlobalConfigContextState => {
  const context = useContext(DiffViewerGlobalConfigContext)
  if (!context) {
    throw new Error('useDiffViewerConfig must be used within a ConfigProvider')
  }
  return context
}
