import { css } from '@emotion/react'
import React, { useContext } from 'react'
import UnwrappedLines from '../../../../shared/components/icons/UnwrappedLine'
import WrappedLines from '../../../../shared/components/icons/WrapLines'
import RichTooltip from '../../../../shared/components/RichTooltip'
import { ThemeContext } from '../../../../shared/providers/theme-context'
import { WrapLinesButtonProps } from './types'

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
