import { render } from '@testing-library/react'
import type React from 'react'
import { useContext } from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Themes } from '../themes'
import type { ThemeTokens } from '../types'
import { ThemeContext, ThemeProvider } from './theme-context'

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

vi.mock('antd', () => ({
  ConfigProvider: ({ children }: { children: React.ReactNode }) => children,
  theme: {
    darkAlgorithm: 'dark-algorithm',
    defaultAlgorithm: 'default-algorithm',
  },
}))

// UTILS
const TestConsumer = ({ onRender }: { onRender: (theme: ThemeTokens) => void }) => {
  const theme = useContext(ThemeContext)
  onRender(theme)
  return null
}

const renderWithTheme = (theme: ThemeTokens) => {
  const onRender = vi.fn()
  render(
    <ThemeProvider theme={theme}>
      <TestConsumer onRender={onRender} />
    </ThemeProvider>,
  )
  return onRender
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ThemeContext', () => {
  test('given default context, when accessed, expect light theme as default value', () => {
    // GIVEN
    const onRender = vi.fn()

    // WHEN
    render(<TestConsumer onRender={onRender} />)

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
      theme: { ...Themes.light, name: 'solarizedDark' },
      expectedHljsTheme: 'dark',
      description: 'solarizedDark theme',
    },
    { theme: { ...Themes.light, name: 'vscodeDark' }, expectedHljsTheme: 'dark', description: 'vscodeDark theme' },
    {
      theme: { ...Themes.light, name: 'solarizedLight' },
      expectedHljsTheme: 'light',
      description: 'solarizedLight theme',
    },
  ]

  test.each(themeTestCases)(
    'given $description, when rendered, expect $expectedHljsTheme hljs data attribute set',
    ({ theme, expectedHljsTheme }) => {
      // WHEN
      renderWithTheme(theme)

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
    ({ theme }) => {
      // WHEN
      const onRender = renderWithTheme(theme)

      // EXPECT
      expect(onRender).toHaveBeenCalledWith(theme)
    },
  )

  test('given custom children, when rendered, expect children to be rendered', () => {
    // GIVEN
    const testId = 'test-child'
    const TestChild = () => <div data-testid={testId}>Test Child</div>

    // WHEN
    const { getByTestId } = render(
      <ThemeProvider theme={Themes.light}>
        <TestChild />
      </ThemeProvider>,
    )

    // EXPECT
    expect(getByTestId(testId)).toBeInTheDocument()
  })
})
