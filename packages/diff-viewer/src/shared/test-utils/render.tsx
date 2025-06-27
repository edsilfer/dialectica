import { render as rtlRender } from '@testing-library/react'
import { DiffViewerThemeProvider } from '../providers/theme-provider'
import { Themes } from '../themes'
import React from 'react'

// A very leniently typed wrapper to avoid React 18 vs 19 type clashes
const Wrapper: React.ComponentType<any> = ({ children }: { children: any }) => (
  <DiffViewerThemeProvider theme={Themes.light}>{children}</DiffViewerThemeProvider>
)

export function render(
  ui: React.ReactElement,
  options?: Parameters<typeof rtlRender>[1],
): ReturnType<typeof rtlRender> {
  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'
