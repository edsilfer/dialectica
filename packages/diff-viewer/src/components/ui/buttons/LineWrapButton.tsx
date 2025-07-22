import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { WrapLinesButtonProps } from './types'
import { ThemeContext } from '../../../../../commons/src/themes/providers/theme-context'
import WrappedLines from '../icons/WrapLines'
import UnwrappedLines from '../icons/UnwrappedLine'
import RichTooltip from '../RichTooltip'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    icon: css`
      color: ${theme.colors.textPrimary};
      cursor: pointer;
    `,
  }
}

const WrapLinesButton: React.FC<WrapLinesButtonProps> = ({ isWrapped, onClick, size = 16 }) => {
  const styles = useStyles()
  const tooltipText = isWrapped ? 'Unwrap lines' : 'Wrap lines'

  const icon = isWrapped ? (
    <WrappedLines css={styles.icon} size={size} onClick={onClick} />
  ) : (
    <UnwrappedLines css={styles.icon} size={size} onClick={onClick} />
  )

  return <RichTooltip tooltipText={tooltipText}>{icon}</RichTooltip>
}

export default WrapLinesButton
