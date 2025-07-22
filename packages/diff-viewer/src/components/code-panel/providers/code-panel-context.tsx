import { readStorageValue, ThemeContext, ThemeProvider, Themes, writeStorageValue } from '@commons'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createContext, useContextSelector } from 'use-context-selector'
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
  ignoreWhitespace: false,
}

const DEFAULT_FILE_STATE: FileState = { isCollapsed: false, isViewed: false }

export const CodePanelConfigContext = createContext<CodePanelConfigContextState | undefined>(undefined)

export const CodePanelConfigProvider: React.FC<CodePanelConfigContextProps> = (props) => {
  const { children, config: externalConfig = DEFAULT_CODE_PANEL_CONFIG, storage = 'in-memory' } = props

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

  const setViewed = useCallback((fileKey: string, isViewed: boolean) => {
    setFileStateMap((prev) => {
      const prevState = prev.get(fileKey) ?? DEFAULT_FILE_STATE
      if (prevState.isViewed === isViewed) return prev // bail-out
      const next = new Map(prev)
      // When marking as viewed, also collapse the file
      const shouldCollapse = isViewed ? true : prevState.isCollapsed
      next.set(fileKey, { ...prevState, isViewed, isCollapsed: shouldCollapse })
      return next
    })
  }, [])

  const setCollapsed = useCallback((fileKey: string, isCollapsed: boolean) => {
    setFileStateMap((prev) => {
      const prevState = prev.get(fileKey) ?? DEFAULT_FILE_STATE
      if (prevState.isCollapsed === isCollapsed) return prev // bail-out
      const next = new Map(prev)
      next.set(fileKey, { ...prevState, isCollapsed })
      return next
    })
  }, [])

  const contextValue = useMemo<CodePanelConfigContextState>(() => {
    const getFileState = (key: string) => fileStateMap.get(key)
    return {
      config,
      fileStateMap,
      allFileKeys,
      setConfig,
      setAllFileKeys,
      setViewed,
      setCollapsed,
      getFileState,
    }
  }, [config, allFileKeys, setConfig, setAllFileKeys, setViewed, setCollapsed, fileStateMap])

  const inheritedTheme = React.useContext(ThemeContext) ?? Themes.light
  const themeToUse = config.theme ?? inheritedTheme

  return (
    <ThemeProvider theme={themeToUse}>
      <CodePanelConfigContext.Provider value={contextValue}>{children}</CodePanelConfigContext.Provider>
    </ThemeProvider>
  )
}

/**
 * returns: the *full* context. Components that call this will re-render when
 *          *any* part of the context changes.
 */
export const useCodePanelConfig = (): CodePanelConfigContextState => {
  const ctx = useContextSelector(CodePanelConfigContext, (c) => c)
  if (!ctx) {
    throw new Error('useCodePanelConfig must be used within a CodePanelConfigProvider')
  }
  return ctx
}

/**
 * Fine-grained subscription for a single file. Re-renders **only** when the
 *
 * @param fileKey - the key of the file to get the state for
 * @returns         the state of the file
 */
export const useFileState = (fileKey: string) => {
  const isCollapsed = useContextSelector(CodePanelConfigContext, (ctx) => {
    if (!ctx) throw new Error('useFileState must be used within a CodePanelConfigProvider')
    return ctx.getFileState(fileKey)?.isCollapsed ?? false
  })

  const isViewed = useContextSelector(CodePanelConfigContext, (ctx) => {
    if (!ctx) throw new Error('useFileState must be used within a CodePanelConfigProvider')
    return ctx.getFileState(fileKey)?.isViewed ?? false
  })

  const setCollapsed = useContextSelector(CodePanelConfigContext, (ctx) => {
    if (!ctx) throw new Error('useFileState must be used within a CodePanelConfigProvider')
    return ctx.setCollapsed
  })

  const setViewed = useContextSelector(CodePanelConfigContext, (ctx) => {
    if (!ctx) throw new Error('useFileState must be used within a CodePanelConfigProvider')
    return ctx.setViewed
  })

  const toggleCollapsed = useCallback((collapsed: boolean) => setCollapsed(fileKey, collapsed), [fileKey, setCollapsed])
  const toggleViewed = useCallback((viewed: boolean) => setViewed(fileKey, viewed), [fileKey, setViewed])

  return {
    isCollapsed,
    isViewed,
    toggleCollapsed,
    toggleViewed,
  }
}

/**
 * Subscribe to configuration settings only
 *
 * @returns the top-level config and a setter for it
 */
export const useCodePanelSettings = () =>
  useContextSelector(CodePanelConfigContext, (ctx) => {
    if (!ctx) throw new Error('useCodePanelSettings must be used within a CodePanelConfigProvider')
    return {
      config: ctx.config,
      setConfig: ctx.setConfig,
    }
  })

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
