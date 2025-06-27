import React, { createContext } from 'react'
import type { ThemeTokens } from '../themes/types'
import { Themes } from '../themes'

export const ThemeContext = createContext<ThemeTokens>(Themes.light)

interface DiffViewerThemeProps {
  /** The children of the theme provider */
  children: React.ReactNode
  /** The theme to use for the diff viewer */
  theme: ThemeTokens
}

export const DiffViewerThemeProvider = ({ children, theme }: DiffViewerThemeProps) => {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}
