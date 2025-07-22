import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../themes/providers/theme-context'
import { Copy } from '../icons/Copy'
import { RichTooltip } from '../RichTooltip'

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

export interface CopyButtonProps {
  /** The size of the copy icon */
  size?: number
  /** The tooltip to display when hovering over the copy icon */
  tooltip?: string
  /** The text to display when the copy is successful */
  toastText?: string
  /** The function to call when the copy icon is clicked */
  onClick: (event: React.MouseEvent<SVGSVGElement>) => void
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
