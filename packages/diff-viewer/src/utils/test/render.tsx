import { render as rtlRender } from '@testing-library/react'
import React from 'react'
import { ThemeProvider } from '../../../../commons/src/themes/providers/theme-context'
import { Themes } from '../../../../commons/src/themes/themes'

/**
 * Wrapper component used to provide the default light theme in tests
 *
 * @param children - The children to render
 * @returns        - The rendered children wrapped in the ThemeProvider
 */
const WrapperComponent = ({ children }: { children?: unknown }) => (
  <ThemeProvider theme={Themes.light}>{children as React.ReactNode}</ThemeProvider>
)

type AnyPropsWithChildren = { children?: unknown; [key: string]: unknown }
const Wrapper = WrapperComponent as React.ComponentType<AnyPropsWithChildren>

/**
 * Renders the given UI with the default light theme
 *
 * @param ui        - The UI to render
 * @param options   - Optional options to pass to the render function
 * @returns         - The rendered UI
 */
export function render(
  ui: React.ReactElement,
  options?: Parameters<typeof rtlRender>[1],
): ReturnType<typeof rtlRender> {
  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'
