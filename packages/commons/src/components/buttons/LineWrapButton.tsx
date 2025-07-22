import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../themes/providers/theme-context'
import UnwrappedLines from '../icons/UnwrappedLine'
import WrappedLines from '../icons/WrapLines'
import { RichTooltip } from '../RichTooltip'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    icon: css`
      color: ${theme.colors.textPrimary};
      cursor: pointer;
    `,
  }
}

export interface LineWrapButtonProps {
  /** Whether the lines are currently wrapped */
  isWrapped: boolean
  /** The size of the copy icon */
  size?: number
  /** The tooltip to display when hovering over the copy icon */
  tooltip?: string
  /** The text to display when the copy is successful */
  toastText?: string
  /** The function to call when the copy icon is clicked */
  onClick: (event: React.MouseEvent<SVGSVGElement>) => void
}

const LineWrapButton: React.FC<LineWrapButtonProps> = ({ isWrapped, onClick, size = 16 }) => {
  const styles = useStyles()
  const tooltipText = isWrapped ? 'Unwrap lines' : 'Wrap lines'

  const icon = isWrapped ? (
    <WrappedLines css={styles.icon} size={size} onClick={onClick} />
  ) : (
    <UnwrappedLines css={styles.icon} size={size} onClick={onClick} />
  )

  return <RichTooltip tooltipText={tooltipText}>{icon}</RichTooltip>
}

export default LineWrapButton
