import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../shared/providers/theme-context'

/**
 * A minimal toolbar that simply displays a "HelloWorld" label.
 * We keep it simple for now – styling is just enough to make it visible
 * against the current theme.
 */
export const Toolbar: React.FC = () => {
  const theme = useContext(ThemeContext)

  const styles = {
    container: css`
      padding: ${theme.spacing.sm};
      background-color: ${theme.colors.backgroundPrimary};
      border-top: 1px solid ${theme.colors.border};
      color: ${theme.colors.textPrimary};
      font-family: ${theme.typography.regularFontFamily};
      font-size: ${theme.typography.regularFontSize}px;
    `,
  }

  return <div css={styles.container}>HelloWorld</div>
}
