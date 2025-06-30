import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../providers/theme-context'
import ChevronDown from '../../icons/ChevronDown'
import RichTooltip from '../RichTooltip'
import { ExpandButtonProps } from './types'

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

const ExpandButton: React.FC<ExpandButtonProps> = ({
  collapsed,
  onClick,
  size = 16,
  tooltipTextExpand = 'Show file content',
  tooltipTextCollapse = 'Hide file content',
}) => {
  const styles = useStyles()
  const tooltipText = collapsed ? tooltipTextExpand : tooltipTextCollapse
  const button = <ChevronDown size={size} css={styles.chevron(collapsed)} onClick={onClick} className="expand-button" />
  return <RichTooltip tooltipText={tooltipText}>{button}</RichTooltip>
}

export default ExpandButton
