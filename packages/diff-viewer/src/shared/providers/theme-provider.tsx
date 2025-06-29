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
      colorPrimary: theme.colors.colorPrimary,
      colorPrimaryActive: theme.colors.accentColor,
      colorTextPlaceholder: theme.colors.placeholderText,
      colorText: theme.colors.textPrimary,
      colorIcon: theme.colors.textPrimary,
      colorIconHover: theme.colors.textPrimary,
      colorBorder: theme.colors.borderBg,
      colorBgBase: theme.colors.hunkViewerBg,
      colorBgContainer: theme.colors.hunkViewerBg,
      colorBgElevated: theme.colors.tooltipBg,

      // Global hover token so components pick accent color on hover
      colorPrimaryHover: theme.colors.accentColor,
      colorPrimaryTextHover: theme.colors.accentColor,

      // Typography
      fontFamily: theme.typography.regularFontFamily,
      fontSize: theme.typography.regularFontSize,
      fontSizeSM: theme.typography.regularFontSizeSM,
    },
    components: {
      Input: {
        colorBgContainer: theme.colors.colorPrimary,
        hoverBorderColor: theme.colors.accentColor,
        activeBorderColor: theme.colors.accentColor,
        activeShadow: 'none',
        inputFontSize: theme.typography.regularFontSize,
      },
      Button: {
        fontSize: theme.typography.regularFontSize,
        fontSizeSM: theme.typography.regularFontSizeSM,
      },
      Checkbox: {
        colorPrimary: theme.colors.accentColor,
        colorPrimaryHover: theme.colors.accentColor,
      },
    },
  }

  return (
    <ThemeContext.Provider value={theme}>
      <ConfigProvider theme={antdThemeConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  )
}
