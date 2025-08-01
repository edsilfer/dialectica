import { css } from '@emotion/react'
import React, { useContext, useMemo } from 'react'
import { ThemeContext } from '../../themes/providers/theme-context'
import { ChevronDownIcon } from '../icons/ChevronDownIcon'
import { RichTooltip } from '../RichTooltip'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return useMemo(
    () => ({
      chevronExpanded: css`
        color: ${theme.colors.textPrimary};
        transform: rotate(0deg);
        transition: transform 0.2s ease-in-out;
        cursor: pointer;
      `,
      chevronCollapsed: css`
        color: ${theme.colors.textPrimary};
        transform: rotate(-90deg);
        transition: transform 0.2s ease-in-out;
        cursor: pointer;
      `,
    }),
    [theme],
  )
}

export interface ExpandButtonProps {
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

export const ExpandButton: React.FC<ExpandButtonProps & React.HTMLAttributes<SVGSVGElement>> = (props) => {
  const {
    collapsed,
    onClick,
    size = 16,
    tooltipTextExpand = 'Show file content',
    tooltipTextCollapse = 'Hide file content',
    ...rest
  } = props

  const styles = useStyles()
  const tooltipText = collapsed ? tooltipTextExpand : tooltipTextCollapse
  const chevronStyle = collapsed ? styles.chevronCollapsed : styles.chevronExpanded
  const button = (
    <ChevronDownIcon
      size={size}
      css={chevronStyle}
      onClick={onClick}
      className="expand-button"
      data-collapsed={collapsed}
      {...rest}
    />
  )
  return <RichTooltip tooltipText={tooltipText}>{button}</RichTooltip>
}
