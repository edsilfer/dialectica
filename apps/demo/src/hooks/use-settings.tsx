import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { getStorageValue, setStorageValue } from './provider-utils'

const SETTINGS_STORAGE_KEY = 'demo_app_settings'

export interface User {
  /** User ID */
  id?: number
  /** User's display name */
  name?: string
  /** GitHub username */
  login?: string
  /** URL to user's avatar image */
  avatar_url?: string
}

interface Settings {
  /** GitHub Personal Access Token */
  githubPat: string
  /** Whether to use mock data */
  useMocks: boolean
  /** Current authenticated user */
  currentUser?: User
  /** Whether to enable the tutorial */
  enableTutorial: boolean
}

const DEFAULT_SETTINGS: Settings = {
  githubPat: '',
  useMocks: false,
  currentUser: undefined,
  enableTutorial: true,
}

interface SettingsContextType {
  /** GitHub Personal Access Token */
  githubPat: string
  /** Whether to use mock data */
  useMocks: boolean
  /** Current authenticated user */
  currentUser?: User
  /** Whether to enable the tutorial */
  enableTutorial: boolean

  /** Set the GitHub Personal Access Token */
  setGithubPat: (pat: string) => void
  /** Set whether to use mock data */
  setUseMocks: (useMocks: boolean) => void
  /** Set the current user */
  setCurrentUser: (user?: User) => void
  /** Set whether to enable the tutorial */
  setEnableTutorial: (enableTutorial: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => getStorageValue(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS))

  const setUseMocks = useCallback(
    (useMocks: boolean) =>
      setSettings((prev) => {
        const next = { ...prev, useMocks }
        setStorageValue(SETTINGS_STORAGE_KEY, next)
        return next
      }),
    [],
  )

  const setGithubPat = useCallback(
    (pat: string) =>
      setSettings((prev) => {
        const next = { ...prev, githubPat: pat }
        setStorageValue(SETTINGS_STORAGE_KEY, next)
        return next
      }),
    [],
  )

  const setCurrentUser = useCallback(
    (user?: User) =>
      setSettings((prev) => {
        const next = { ...prev, currentUser: user }
        setStorageValue(SETTINGS_STORAGE_KEY, next)
        return next
      }),
    [],
  )

  const setEnableTutorial = useCallback(
    (enableTutorial: boolean) =>
      setSettings((prev) => {
        const next = { ...prev, enableTutorial }
        setStorageValue(SETTINGS_STORAGE_KEY, next)
        return next
      }),
    [],
  )

  const value: SettingsContextType = useMemo(
    () => ({
      githubPat: settings.githubPat,
      useMocks: settings.useMocks,
      currentUser: settings.currentUser,
      enableTutorial: settings.enableTutorial,
      setGithubPat,
      setUseMocks,
      setCurrentUser,
      setEnableTutorial,
    }),
    [settings, setGithubPat, setUseMocks, setCurrentUser, setEnableTutorial],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
