import React, { createContext } from 'react'
import { ConfigProvider } from 'antd'
import type { ThemeConfig } from 'antd/es/config-provider/context'
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
  const antdThemeConfig: ThemeConfig = {
    token: {
      colorPrimary: theme.colors.defaultBg,
      colorPrimaryActive: theme.colors.accentColor,
      colorTextPlaceholder: theme.colors.placeholderText,
      colorText: theme.colors.textPrimary,
      colorIcon: theme.colors.textPrimary,
      colorIconHover: theme.colors.textPrimary,
      colorBorder: theme.colors.borderBg,
      colorBgBase: theme.colors.hunkViewerBg,
      colorBgContainer: theme.colors.hunkViewerBg,
      colorBgElevated: theme.colors.fileExplorerBg,
    },
    components: {
      Input: {
        colorBgContainer: theme.colors.defaultBg,
        hoverBorderColor: theme.colors.borderBg,
        activeBorderColor: theme.colors.borderBg,
        activeShadow: 'none',
        inputFontSize: theme.typography.codeFontSize,
      },
    },
  }

  return (
    <ThemeContext.Provider value={theme}>
      <ConfigProvider theme={antdThemeConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  )
}
