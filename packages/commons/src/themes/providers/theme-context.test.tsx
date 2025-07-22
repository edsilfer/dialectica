import React from 'react'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createAntdMocks } from '../../test/antd-utils'
import { renderWithContext } from '../../test/context-test-utils'
import { createPropsFactory, expectElementToBeInTheDocument } from '../../test/generic-test-utils'
import { Themes } from '../themes'
import type { ThemeTokens } from '../types'
import { ThemeContext, ThemeProvider, useTheme } from './theme-context'

// MOCKS
const mockSetAttribute = vi.fn()

Object.defineProperty(document, 'documentElement', {
  value: {
    setAttribute: mockSetAttribute,
  },
  writable: true,
})

vi.mock('@emotion/react', () => ({
  Global: ({ children }: { children: React.ReactNode }) => children,
  css: vi.fn(() => 'mocked-css'),
}))

vi.mock('antd', () => createAntdMocks())

// UTILS
const createThemeProviderProps = createPropsFactory<{ theme: ThemeTokens; children: React.ReactNode }>({
  theme: Themes.light,
  children: null,
})

const renderWithTheme = (theme: ThemeTokens) => {
  return renderWithContext(ThemeProvider, useTheme, { theme, children: null })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ThemeContext', () => {
  test('given default context, when accessed, expect light theme as default value', () => {
    // GIVEN
    const onRender = vi.fn()

    // WHEN
    render(
      <ThemeContext.Consumer>
        {(theme) => {
          onRender(theme)
          return null
        }}
      </ThemeContext.Consumer>,
    )

    // EXPECT
    expect(onRender).toHaveBeenCalledWith(Themes.light)
  })
})

describe('ThemeProvider', () => {
  // Test matrix for hljs data attribute setting
  const themeTestCases = [
    { theme: Themes.light, expectedHljsTheme: 'light', description: 'light theme' },
    { theme: Themes.dark, expectedHljsTheme: 'dark', description: 'dark theme' },
    { theme: Themes.dracula, expectedHljsTheme: 'dark', description: 'dracula theme' },
    {
      theme: { ...Themes.light, name: 'solarizedDark', flavor: 'dark' as const },
      expectedHljsTheme: 'dark',
      description: 'solarizedDark theme',
    },
    {
      theme: { ...Themes.light, name: 'vscodeDark', flavor: 'dark' as const },
      expectedHljsTheme: 'dark',
      description: 'vscodeDark theme',
    },
    {
      theme: { ...Themes.light, name: 'solarizedLight' },
      expectedHljsTheme: 'light',
      description: 'solarizedLight theme',
    },
  ]

  test.each(themeTestCases)(
    'given $description, when rendered, expect $expectedHljsTheme hljs data attribute set',
    async ({ theme, expectedHljsTheme }) => {
      // WHEN
      await renderWithTheme(theme)

      // EXPECT
      expect(mockSetAttribute).toHaveBeenCalledWith('data-hljs-theme', expectedHljsTheme)
    },
  )

  const contextTestCases = [
    { theme: Themes.light, description: 'light theme' },
    { theme: Themes.dark, description: 'dark theme' },
  ]

  test.each(contextTestCases)(
    'given $description, when rendered, expect theme provided to children via context',
    async ({ theme }) => {
      // WHEN
      const getTheme = await renderWithTheme(theme)

      // EXPECT
      expect(getTheme()).toEqual(theme)
    },
  )

  test('given custom children, when rendered, expect children to be rendered', () => {
    // GIVEN
    const testId = 'test-child'
    const TestChild = () => <div data-testid={testId}>Test Child</div>
    const props = createThemeProviderProps({
      theme: Themes.light,
      children: <TestChild />,
    })

    // WHEN
    render(<ThemeProvider {...props} />)

    // EXPECT
    expectElementToBeInTheDocument(testId)
  })
})
