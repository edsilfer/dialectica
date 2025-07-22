import { Global, css } from '@emotion/react'
import React, { useContext } from 'react'
import { ConfigProvider, theme as antdTheme } from 'antd'
import type { ThemeConfig } from 'antd/es/config-provider/context'
import { createContext } from 'react'
import { Themes } from '../themes'
import { ThemeTokens } from '../types'

export const ThemeContext = createContext<ThemeTokens>(Themes.light)

export const ThemeProvider = ({ children, theme }: { children: React.ReactNode; theme: ThemeTokens }) => {
  const isDarkTheme = theme.flavor === 'dark'
  document.documentElement.setAttribute('data-hljs-theme', isDarkTheme ? 'dark' : 'light')

  const antdThemeConfig: ThemeConfig = {
    algorithm: isDarkTheme ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: theme.colors.accent,
      colorText: theme.colors.textPrimary,
      colorTextPlaceholder: theme.colors.textPrimaryPlaceholder,
      colorBorder: theme.colors.border,
      colorBgBase: theme.colors.backgroundPrimary,
      colorBgContainer: theme.colors.backgroundPrimary,
      colorBgElevated: theme.colors.backgroundContainer,

      // Typography
      fontFamily: theme.typography.regularFontFamily,
      fontSize: theme.typography.regularFontSize,
      fontSizeSM: theme.typography.regularFontSizeSM,
    },
    components: {},
  }

  return (
    <ThemeContext.Provider value={theme}>
      {/* Global styles ensure scrollbars follow the active theme */}
      <Global
        styles={css`
          /* WebKit-based browsers */
          *::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          *::-webkit-scrollbar-track {
            background: ${theme.colors.hunkViewerBg};
          }

          *::-webkit-scrollbar-thumb {
            background-color: ${theme.colors.border};
            border-radius: 4px;
          }

          *::-webkit-scrollbar-thumb:hover {
            background-color: ${theme.colors.accent};
          }

          /* Firefox */
          * {
            scrollbar-width: thin;
            scrollbar-color: ${theme.colors.border} ${theme.colors.hunkViewerBg};
          }
        `}
      />
      <ConfigProvider theme={antdThemeConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeTokens => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
