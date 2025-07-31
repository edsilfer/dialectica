import { ThemeContext, Themes } from '@commons'
import { useDiffViewerConfig } from '@diff-viewer'
import { css } from '@emotion/react'
import { Select } from 'antd'
import { useContext } from 'react'

const useStyles = () => {
  return {
    themeSwitcher: css`
      position: absolute;
      top: 0;
      right: 0;
    `,
  }
}

export default function ThemeSelector() {
  const theme = useContext(ThemeContext)
  const styles = useStyles()
  const { setTheme } = useDiffViewerConfig()

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
      onChange={(value: string) => setTheme(Themes[value])}
      options={options}
    />
  )
}
