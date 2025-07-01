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
  storage = 'in-memory',
}) => {
  const STORAGE_KEY = '__code_panel_view_state__'

  /*
   * Hydrate state from localStorage when requested. This includes the
   * user-specific view state (viewed / collapsed files) **and** the most recent
   * `config` overrides that were in effect when the user last interacted with
   * the code panel. If no persisted data is available—or `storage` is
   * "in-memory"—we fall back to the values coming from above (initialConfig).
   */
  const storedState = React.useMemo<{
    viewedFiles?: string[]
    collapsedFiles?: string[]
    config?: CodePanelConfig
  } | null>(() => {
    if (storage !== 'local' || typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as {
        viewedFiles?: string[]
        collapsedFiles?: string[]
        config?: CodePanelConfig
      }
    } catch {
      return null
    }
  }, [storage])

  const [config, setConfig] = useState<CodePanelConfig>({ ...initialConfig, ...(storedState?.config ?? {}) })
  const [viewedFiles, setViewedFiles] = useState<string[]>(storedState?.viewedFiles ?? [])
  const [collapsedFiles, setCollapsedFiles] = useState<string[]>(storedState?.collapsedFiles ?? [])
  const [allFileKeys, setAllFileKeys] = useState<string[]>([])

  // Keep internal config in sync with incoming prop changes but avoid clobbering
  // the initially hydrated (possibly persisted) state on the very first render.
  const isFirstRender = React.useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    // Merge new initialConfig with stored config, giving precedence to stored values
    setConfig({ ...initialConfig, ...(storedState?.config ?? {}) })
  }, [initialConfig, storedState])

  /*
   * Keep collapsedFiles in sync with viewedFiles:
   * 1. Files marked as viewed should be collapsed.
   * 2. Files unviewed should be expanded (removed from collapsed list).
   */
  useEffect(() => {
    setCollapsedFiles((prev) => {
      // Remove any entries no longer viewed
      const stillValid = prev.filter((key) => viewedFiles.includes(key))
      // Add newly viewed files that are not yet collapsed
      const missing = viewedFiles.filter((key) => !stillValid.includes(key))
      if (missing.length === 0 && stillValid.length === prev.length) return prev
      return [...stillValid, ...missing]
    })
  }, [viewedFiles])

  // Persist view state whenever it changes
  useEffect(() => {
    if (storage !== 'local' || typeof window === 'undefined') return
    const serialisable = {
      viewedFiles,
      collapsedFiles,
      config,
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialisable))
    } catch {
      /* Ignore quota / serialization errors silently */
    }
  }, [storage, viewedFiles, collapsedFiles, config])

  const value = {
    config,
    viewedFiles,
    collapsedFiles,
    allFileKeys,
    setConfig,
    setViewedFiles,
    setCollapsedFiles,
    setAllFileKeys,
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
