import { Themes, ThemeTokens } from '@commons'
import { useEffect, useState } from 'react'

export function usePreferedTheme() {
  const getCurrentPreference = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? Themes.dark : Themes.light

  const [preferredTheme, setPreferredTheme] = useState<ThemeTokens>(() => getCurrentPreference())

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setPreferredTheme(e.matches ? Themes.dark : Themes.light)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return preferredTheme
}
