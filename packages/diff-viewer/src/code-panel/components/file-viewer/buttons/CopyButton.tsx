import { css } from '@emotion/react'
import React, { useContext } from 'react'
import Copy from '../../../../shared/components/icons/Copy'
import RichTooltip from '../../../../shared/components/RichTooltip'
import { ThemeContext } from '../../../../shared/providers/theme-context'
import { CopyButtonProps } from './types'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    copyIcon: css`
      cursor: pointer;
      font-size: 14px;
      color: ${theme.colors.textPrimary};
    `,
  }
}

const CopyButton: React.FC<CopyButtonProps> = ({ onClick, size = 16, tooltip, toastText }) => {
  const styles = useStyles()

  const button = <Copy size={size} css={styles.copyIcon} onClick={onClick} />

  if (tooltip || toastText) {
    return (
      <RichTooltip tooltipText={tooltip} toastText={toastText}>
        {button}
      </RichTooltip>
    )
  }

  return button
}

export default CopyButton
