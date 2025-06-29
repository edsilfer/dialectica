import { Themes, ThemeTokens } from '@diff-viewer'
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react'

const LOCAL_STORAGE_KEY = 'diff-viewer-context'

interface DiffViewerContextState {
  /** The theme to use for the diff viewer */
  theme: ThemeTokens
  /** Whether to split the view into two panes */
  isSplitView: boolean
  /** Whether to collapse packages */
  collapsePackages: boolean
  /** Whether to show icons in the file explorer */
  showIcons: boolean
  /** Whether to show file details in the file explorer */
  displayNodeDetails: boolean
  /** Whether to wrap long lines in diff viewer */
  wrapLines: boolean
  /** Set the theme to use for the diff viewer */
  setTheme: (theme: ThemeTokens) => void
  /** Set whether to split the view into two panes */
  setIsSplitView: (isSplitView: boolean) => void
  /** Set whether to collapse packages */
  setCollapsePackages: (collapsePackages: boolean) => void
  /** Set whether to show icons in the file explorer */
  setShowIcons: (showIcons: boolean) => void
  /** Set whether to show file details in the file explorer */
  setDisplayNodeDetails: (displayNodeDetails: boolean) => void
  /** Set whether to wrap lines */
  setWrapLines: (wrapLines: boolean) => void
}

const DiffViewerContext = createContext<DiffViewerContextState | undefined>(undefined)

const loadFromLocalStorage = (): Partial<DiffViewerContextState> => {
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (serializedState === null) return {}
    const storedState = JSON.parse(serializedState)
    if (storedState.theme) {
      const themeName = storedState.theme.name as keyof typeof Themes
      storedState.theme = Themes[themeName] || Themes.light
    }
    return storedState
  } catch (error) {
    console.error('Error loading state from local storage:', error)
    return {}
  }
}

interface DiffViewerStateProviderProps {
  children: ReactNode
}

export const DiffViewerStateProvider: React.FC<DiffViewerStateProviderProps> = ({ children }) => {
  const [initialState] = useState(loadFromLocalStorage)

  const [theme, setTheme] = useState<ThemeTokens>(initialState.theme || Themes.light)
  const [isSplitView, setIsSplitView] = useState<boolean>(initialState.isSplitView ?? false)
  const [collapsePackages, setCollapsePackages] = useState<boolean>(
    initialState.collapsePackages ?? true,
  )
  const [showIcons, setShowIcons] = useState<boolean>(initialState.showIcons ?? false)
  const [displayNodeDetails, setDisplayNodeDetails] = useState<boolean>(
    initialState.displayNodeDetails ?? false,
  )
  const [wrapLines, setWrapLines] = useState<boolean>(initialState.wrapLines ?? false)

  useEffect(() => {
    const themeName = Object.keys(Themes).find(
      (key) => Themes[key as keyof typeof Themes] === theme,
    )
    const stateToSave = {
      theme: { name: themeName },
      isSplitView,
      collapsePackages,
      showIcons,
      displayNodeDetails,
      wrapLines,
    }
    try {
      const serializedState = JSON.stringify(stateToSave)
      localStorage.setItem(LOCAL_STORAGE_KEY, serializedState)
    } catch (error) {
      console.error('Error saving state to local storage:', error)
    }
  }, [theme, isSplitView, collapsePackages, showIcons, displayNodeDetails, wrapLines])

  const contextValue: DiffViewerContextState = {
    theme,
    isSplitView,
    collapsePackages,
    showIcons,
    displayNodeDetails,
    wrapLines,
    setTheme,
    setIsSplitView,
    setCollapsePackages,
    setShowIcons,
    setDisplayNodeDetails,
    setWrapLines,
  }

  return <DiffViewerContext.Provider value={contextValue}>{children}</DiffViewerContext.Provider>
}

export const useDiffViewerState = (): DiffViewerContextState => {
  const context = useContext(DiffViewerContext)
  if (context === undefined) {
    throw new Error('useDiffViewerState must be used within a DiffViewerStateProvider')
  }
  return context
}
