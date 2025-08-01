import { ThemeContext, Themes, ThemeTokens } from '@edsilfer/commons'
import { useDiffViewerConfig } from '@edsilfer/diff-viewer'
import { css } from '@emotion/react'
import { Select } from 'antd'
import { useContext } from 'react'

const useStyles = (theme: ThemeTokens) => {
  return {
    themeSwitcher: css`
      position: absolute;
      min-width: 150px;
      top: ${theme.spacing.sm};
      right: ${theme.spacing.sm};
      border-radius: ${theme.spacing.sm};
      box-shadow: 0 0 10px ${theme.colors.accent}40;
    `,
  }
}

export default function ThemeSelector() {
  const theme = useContext(ThemeContext)
  const styles = useStyles(theme)
  const { config, setConfig } = useDiffViewerConfig()

  const options = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'dracula', label: 'Dracula' },
    { value: 'solarizedDark', label: 'Solarized Dark' },
    { value: 'solarizedLight', label: 'Solarized Light' },
    { value: 'vscodeDark', label: 'VSCode Dark' },
  ]

  return (
    <Select
      css={styles.themeSwitcher}
      value={theme.name}
      onChange={(value: string) => setConfig({ ...config, theme: Themes[value] })}
      options={options}
    />
  )
}
