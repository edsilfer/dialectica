import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ThemeContext, ThemeProvider } from '../../shared/providers/theme-context'
import { readStorageValue, writeStorageValue } from '../../shared/storage-utils'
import { Themes } from '../../shared/themes'
import {
  CodePanelConfig,
  CodePanelConfigContextProps,
  CodePanelConfigContextState,
  FileState,
  PersistableState,
} from './types'

const STORAGE_KEY = '__code_panel_view_state__'

export const DEFAULT_CODE_PANEL_CONFIG: CodePanelConfig = {
  mode: 'unified',
  highlightSyntax: false,
  ignoreWhitespace: false,
}

/*
 * Context holding both the persistent view preferences (viewed / collapsed
 * files) and runtime setters required by the panel internals.
 */
const CodePanelConfigContext = createContext<CodePanelConfigContextState | undefined>(undefined)

export const CodePanelConfigProvider: React.FC<CodePanelConfigContextProps> = (props) => {
  const { children, config: externalConfig = DEFAULT_CODE_PANEL_CONFIG, storage = 'in-memory' } = props

  /*
   * 1. Hydrate (optionally) persisted view state.
   * 2. Prepare runtime setters.
   */
  const storedState = useMemo(() => {
    if (storage !== 'local') return null
    return readStorageValue<Partial<PersistableState>>(STORAGE_KEY)
  }, [storage])

  const [config, setConfig] = useState<CodePanelConfig>({
    ...externalConfig,
    ...(storedState?.config ?? {}),
  })
  const initialFileStateMap = useMemo(() => {
    const record = storedState?.fileStates ?? {}
    return new Map<string, FileState>(Object.entries(record))
  }, [storedState])

  const [fileStateMap, setFileStateMap] = useState<Map<string, FileState>>(initialFileStateMap)
  const [allFileKeys, setAllFileKeys] = useState<string[]>([])

  useSyncExternalConfig(externalConfig, storedState, setConfig)
  useEffect(() => {
    if (storage !== 'local') return
    writeStorageValue(STORAGE_KEY, { config, fileStates: Object.fromEntries(fileStateMap) })
  }, [storage, config, fileStateMap])

  const setViewed = React.useCallback((fileKey: string, isViewed: boolean) => {
    setFileStateMap((prev) => {
      const next = new Map(prev)
      const prevState = next.get(fileKey) ?? { isCollapsed: false, isViewed: false }
      next.set(fileKey, { ...prevState, isViewed })
      return next
    })
  }, [])

  const setCollapsed = React.useCallback((fileKey: string, isCollapsed: boolean) => {
    setFileStateMap((prev) => {
      const next = new Map(prev)
      const prevState = next.get(fileKey) ?? { isCollapsed: false, isViewed: false }
      next.set(fileKey, { ...prevState, isCollapsed })
      return next
    })
  }, [])

  const contextValue = useMemo<CodePanelConfigContextState>(
    () => ({
      config,
      fileStateMap,
      allFileKeys,
      setConfig,
      setViewed,
      setCollapsed,
      setAllFileKeys,
    }),
    [config, fileStateMap, allFileKeys, setConfig, setViewed, setCollapsed, setAllFileKeys],
  )

  const inheritedTheme = useContext(ThemeContext) ?? Themes.light
  const themeToUse = config.theme ?? inheritedTheme

  return (
    <ThemeProvider theme={themeToUse}>
      <CodePanelConfigContext.Provider value={contextValue}>{children}</CodePanelConfigContext.Provider>
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

function useSyncExternalConfig(
  externalConfig: CodePanelConfig,
  storedState: Partial<PersistableState> | null,
  setConfig: React.Dispatch<React.SetStateAction<CodePanelConfig>>,
) {
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setConfig({ ...externalConfig, ...(storedState?.config ?? {}) })
  }, [externalConfig, storedState, setConfig])
}
