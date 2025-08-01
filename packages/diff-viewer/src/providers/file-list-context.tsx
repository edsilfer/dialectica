import {
  readStorageValue,
  ThemeContext,
  ThemeProvider,
  Themes,
  ThemeTokens,
  writeStorageValue,
} from '@edsilfer/commons'
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createContext, useContextSelector } from 'use-context-selector'
import { DisplayType } from '../components/file-list/models/types'

// CONSTANTS --------------------------------------------------------------------------------------------
const STORAGE_KEY = '__file_list_config__'

const DEFAULT_FILE_STATE: FileState = { isCollapsed: false, isViewed: false }

export const DEFAULT_FILE_LIST_CONFIG: FileListConfig = {
  mode: 'unified',
  ignoreWhitespace: false,
  maxFileLines: 1000,
  maxLinesToFetch: 5,
}

// TYPES ------------------------------------------------------------------------------------------------
/** Configuration options for how the diff should be displayed */
export interface FileListConfig {
  /** The theme for the viewer */
  theme?: ThemeTokens
  /** The mode to display the diff in. */
  mode: DisplayType
  /** Whether to ignore whitespace in the diff. */
  ignoreWhitespace?: boolean
  /** The maximum number of lines to display for a file. Defaults to 1000. */
  maxFileLines: number
  /** The maximum number of lines to fetch for a file. Defaults to 5. */
  maxLinesToFetch: number
}

export interface FileListConfigContextProps {
  /** The children of the diff viewer config provider */
  children: ReactNode
  /** The configuration for the diff viewer*/
  config?: FileListConfig
  /** Where the configuration should be stored. "in-memory" keeps the previous behaviour (default) and "local" persists values in localStorage */
  storage?: 'in-memory' | 'local'
  /** Set the configuration for the diff viewer */
  setConfig?: React.Dispatch<React.SetStateAction<FileListConfig>>
}

export interface FileState {
  /** Whether the file is currently collapsed */
  isCollapsed: boolean
  /** Whether the file has been marked as viewed */
  isViewed: boolean
}

export type PersistableState = {
  /** Map holding per-file UI state (collapsed / viewed) */
  fileStates: Record<string, FileState>
  /** The configuration for the diff viewer */
  config: FileListConfig
}

export interface FileListConfigContextState {
  /** The configuration for the diff viewer */
  config: FileListConfig
  /** Map holding per-file UI state (collapsed / viewed) */
  fileStateMap: Map<string, FileState>
  /** List of all file keys (paths) currently present in the diff */
  allFileKeys: string[]

  /** Get the state of a file */
  getFileState: (fileKey: string) => FileState | undefined
  /** Mark a file as viewed or unviewed */
  setViewed: (fileKey: string, isViewed: boolean) => void
  /** Collapse or expand a file */
  setCollapsed: (fileKey: string, isCollapsed: boolean) => void
  /** Setter for the list of all file keys */
  setAllFileKeys: React.Dispatch<React.SetStateAction<string[]>>
  /** Set the configuration for the diff viewer */
  setConfig: React.Dispatch<React.SetStateAction<FileListConfig>>
}

// CONTEXT ----------------------------------------------------------------------------------------------
export const FileListConfigContext = createContext<FileListConfigContextState | undefined>(undefined)

export const FileListConfigProvider: React.FC<FileListConfigContextProps> = (props) => {
  const { children, config: externalConfig = DEFAULT_FILE_LIST_CONFIG, storage = 'in-memory' } = props

  const storedState = useMemo(() => {
    if (storage !== 'local') return null
    return readStorageValue<Partial<PersistableState>>(STORAGE_KEY)
  }, [storage])

  const [config, setConfig] = useState<FileListConfig>({
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

  const contextValue = useMemo<FileListConfigContextState>(() => {
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
      <FileListConfigContext.Provider value={contextValue}>{children}</FileListConfigContext.Provider>
    </ThemeProvider>
  )
}

/**
 * returns: the *full* context. Components that call this will re-render when
 *          *any* part of the context changes.
 */
export const useFileListConfig = (): FileListConfigContextState => {
  const ctx = useContextSelector(FileListConfigContext, (c) => c)
  if (!ctx) {
    throw new Error('useFileListConfig must be used within a FileListConfigProvider')
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
  const isCollapsed = useContextSelector(FileListConfigContext, (ctx) => {
    if (!ctx) throw new Error('useFileState must be used within a CodePanelConfigProvider')
    return ctx.getFileState(fileKey)?.isCollapsed ?? false
  })

  const isViewed = useContextSelector(FileListConfigContext, (ctx) => {
    if (!ctx) throw new Error('useFileState must be used within a CodePanelConfigProvider')
    return ctx.getFileState(fileKey)?.isViewed ?? false
  })

  const setCollapsed = useContextSelector(FileListConfigContext, (ctx) => {
    if (!ctx) throw new Error('useFileState must be used within a CodePanelConfigProvider')
    return ctx.setCollapsed
  })

  const setViewed = useContextSelector(FileListConfigContext, (ctx) => {
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
export const useFileListSettings = () =>
  useContextSelector(FileListConfigContext, (ctx) => {
    if (!ctx) throw new Error('useFileListSettings must be used within a FileListConfigProvider')
    return {
      config: ctx.config,
      setConfig: ctx.setConfig,
    }
  })

function useSyncExternalConfig(
  externalConfig: FileListConfig,
  storedState: Partial<PersistableState> | null,
  setConfig: React.Dispatch<React.SetStateAction<FileListConfig>>,
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
