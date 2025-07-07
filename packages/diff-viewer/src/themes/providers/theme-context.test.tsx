import { render, screen } from '@testing-library/react'
import { useContext } from 'react'
import { describe, expect, it } from 'vitest'

import { Themes } from '../all-themes'
import { ThemeContext, ThemeProvider } from './theme-context'

function Consumer() {
  const theme = useContext(ThemeContext)
  return <span data-testid="theme-name">{theme.name}</span>
}

describe('ThemeProvider / ThemeContext', () => {
  it('exposes the light theme as the default value', () => {
    render(<Consumer />)

    expect(screen.getByTestId('theme-name')).toHaveTextContent('light')
  })

  it('provides the supplied theme to its descendants', () => {
    render(
      <ThemeProvider theme={Themes.dark}>
        <Consumer />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme-name')).toHaveTextContent('dark')
  })
})
