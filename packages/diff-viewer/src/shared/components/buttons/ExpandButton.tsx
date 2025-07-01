import { css } from '@emotion/react'
import React, { useContext, useMemo } from 'react'
import { ThemeContext } from '../../providers/theme-context'
import ChevronDown from '../../icons/ChevronDown'
import RichTooltip from '../RichTooltip'
import { ExpandButtonProps } from './types'

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

const ExpandButton: React.FC<ExpandButtonProps> = ({
  collapsed,
  onClick,
  size = 16,
  tooltipTextExpand = 'Show file content',
  tooltipTextCollapse = 'Hide file content',
}) => {
  const styles = useStyles()
  const tooltipText = collapsed ? tooltipTextExpand : tooltipTextCollapse
  const chevronStyle = collapsed ? styles.chevronCollapsed : styles.chevronExpanded
  const button = <ChevronDown size={size} css={chevronStyle} onClick={onClick} className="expand-button" />
  return <RichTooltip tooltipText={tooltipText}>{button}</RichTooltip>
}

export default ExpandButton
