import React, { createContext, ReactNode, useContext, useState } from 'react'
import { getStorageValue, setStorageValue } from './provider-utils'
import { Settings, SettingsContextType } from './types'

const SETTINGS_STORAGE_KEY = 'demo_app_settings'

const DEFAULT_SETTINGS: Settings = {
  githubPat: '',
  useMocks: true,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => getStorageValue(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS))

  const setGithubPat = (pat: string) => {
    const newSettings = { ...settings, githubPat: pat }
    setSettings(newSettings)
    setStorageValue(SETTINGS_STORAGE_KEY, newSettings)
  }

  const setUseMocks = (useMocks: boolean) => {
    const newSettings = { ...settings, useMocks }
    setSettings(newSettings)
    setStorageValue(SETTINGS_STORAGE_KEY, newSettings)
  }

  const value: SettingsContextType = {
    githubPat: settings.githubPat,
    useMocks: settings.useMocks,
    setGithubPat,
    setUseMocks,
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
