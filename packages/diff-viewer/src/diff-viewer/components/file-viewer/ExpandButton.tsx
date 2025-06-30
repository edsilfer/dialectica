import React, { useContext } from 'react'
import { css } from '@emotion/react'
import ChevronDown from '../../../shared/components/icons/ChevronDown'
import { ThemeContext } from '../../../shared/providers/theme-context'
import RichTooltip from '../../../shared/components/RichTooltip'

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
  /** Whether the section is currently collapsed */
  collapsed: boolean
  /** The size of the chevron icon */
  size?: number
  /** Tooltip text to show when the section is collapsed (defaults to "Show file content") */
  tooltipTextExpand?: string
  /** Tooltip text to show when the section is expanded (defaults to "Hide file content") */
  tooltipTextCollapse?: string

  // Callbacks ____________________________________________
  /** Optional click handler attached to the chevron element */
  onClick?: (event: React.MouseEvent<SVGSVGElement>) => void
}

const ExpandButton: React.FC<ExpandButtonProps> = ({
  collapsed,
  onClick,
  size = 16,
  tooltipTextExpand = 'Show file content',
  tooltipTextCollapse = 'Hide file content',
}) => {
  const styles = useStyles()
  const tooltipText = collapsed ? tooltipTextExpand : tooltipTextCollapse
  const button = (
    <ChevronDown
      size={size}
      css={styles.chevron(collapsed)}
      onClick={onClick}
      className="expand-button"
    />
  )
  return <RichTooltip tooltipText={tooltipText}>{button}</RichTooltip>
}

export default ExpandButton
