import React, { useContext } from 'react'
import { css } from '@emotion/react'
import ChevronDown from '../../icons/ChevronDown'
import { ThemeContext } from '../../providers/theme-provider'
import RichTooltip from '../RichTooltip'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    chevron: (collapsed: boolean) => css`
      color: ${theme.colors.textPrimary};
      transform: ${collapsed ? 'rotate(-90deg)' : 'rotate(0deg)'};
      transition: transform 0.2s ease-in-out;
      cursor: pointer;
    `,
  }
}

interface ExpandButtonProps {
  /** Whether the content is currently collapsed */
  collapsed: boolean
  /** The size of the chevron icon */
  size?: number
  /** The function to call when the expand button is clicked */
  onClick: (event: React.MouseEvent<SVGSVGElement>) => void
}

const ExpandButton: React.FC<ExpandButtonProps> = ({ collapsed, onClick, size = 16 }) => {
  const styles = useStyles()
  const tooltipText = collapsed ? 'Show file content' : 'Hide file content'
  const button = <ChevronDown size={size} css={styles.chevron(collapsed)} onClick={onClick} />
  return <RichTooltip tooltipText={tooltipText}>{button}</RichTooltip>
}

export default ExpandButton
