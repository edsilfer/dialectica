import React, { createContext, useContext, useState } from 'react'
import { DiffViewerThemeProvider } from '../../shared/providers/theme-provider'
import { Themes } from '../../shared/themes'
import {
  DiffViewerConfig,
  DiffViewerConfigContextProps,
  DiffViewerConfigContextState,
} from './types'

const DEFAULT_CONFIG: DiffViewerConfig = {
  mode: 'unified',
  highlightSyntax: false,
  showLineNumbers: true,
  ignoreWhitespace: false,
  wrapLines: true,
}

/**
 * Keeps the configuration context for the DiffViewer component.
 */
const DiffViewerConfigContext = createContext<DiffViewerConfigContextState | undefined>(undefined)

export const DiffViewerConfigProvider: React.FC<DiffViewerConfigContextProps> = ({
  children,
  config: initialConfig = DEFAULT_CONFIG,
}) => {
  const [config, setConfig] = useState<DiffViewerConfig>(initialConfig)

  const value = {
    config,
    setConfig,
  }

  return (
    <DiffViewerThemeProvider theme={config.theme ?? Themes.light}>
      <DiffViewerConfigContext.Provider value={value}>{children}</DiffViewerConfigContext.Provider>
    </DiffViewerThemeProvider>
  )
}

export const useDiffViewerConfig = (): DiffViewerConfigContextState => {
  const context = useContext(DiffViewerConfigContext)
  if (!context) {
    throw new Error('useDiffViewerConfig must be used within a ConfigProvider')
  }
  return context
}
