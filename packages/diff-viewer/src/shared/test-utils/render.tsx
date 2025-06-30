import { render as rtlRender } from '@testing-library/react'
import { ThemeProvider } from '../providers/theme-context'
import { Themes } from '../themes'
import React from 'react'

// Wrapper component used to provide the default light theme in tests
const WrapperComponent = ({ children }: { children?: unknown }) => (
  <ThemeProvider theme={Themes.light}>{children as React.ReactNode}</ThemeProvider>
)

type AnyPropsWithChildren = { children?: unknown; [key: string]: unknown }

const Wrapper = WrapperComponent as React.ComponentType<AnyPropsWithChildren>

export function render(
  ui: React.ReactElement,
  options?: Parameters<typeof rtlRender>[1],
): ReturnType<typeof rtlRender> {
  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'
