import React, { createContext, useContext, useState, useEffect } from 'react'
import { ThemeProvider, ThemeContext } from '../../shared/providers/theme-context'
import { Themes } from '../../shared/themes'
import { CodePanelConfig, CodePanelConfigContextProps, CodePanelConfigContextState } from './types'

export const DEFAULT_CODE_PANEL_CONFIG: CodePanelConfig = {
  mode: 'unified',
  highlightSyntax: false,
  showLineNumbers: true,
  ignoreWhitespace: false,
}

/**
 * Keeps the configuration context for the DiffViewer component.
 */
const CodePanelConfigContext = createContext<CodePanelConfigContextState | undefined>(undefined)

export const CodePanelConfigProvider: React.FC<CodePanelConfigContextProps> = ({
  children,
  config: initialConfig = DEFAULT_CODE_PANEL_CONFIG,
}) => {
  const [config, setConfig] = useState<CodePanelConfig>(initialConfig)

  useEffect(() => setConfig(initialConfig), [initialConfig])

  const value = {
    config,
    setConfig,
  }

  /*
   * - Obtain the current theme from any ancestor ThemeContext
   * - If no explicit theme is provided via the config, fall back to it
   */
  const inheritedTheme = React.useContext(ThemeContext) ?? Themes.light
  const themeToUse = config.theme ?? inheritedTheme

  return (
    <ThemeProvider theme={themeToUse}>
      <CodePanelConfigContext.Provider value={value}>{children}</CodePanelConfigContext.Provider>
    </ThemeProvider>
  )
}

export const useCodePanelConfig = (): CodePanelConfigContextState => {
  const context = useContext(CodePanelConfigContext)
  if (!context) {
    throw new Error('useCodePanelConfig must be used within a ConfigProvider')
  }
  return context
}
