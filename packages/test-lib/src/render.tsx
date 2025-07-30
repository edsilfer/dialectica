import { render as rtlRender } from '@testing-library/react'
import React from 'react'

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
  return rtlRender(ui, { ...options })
}

export * from '@testing-library/react'
