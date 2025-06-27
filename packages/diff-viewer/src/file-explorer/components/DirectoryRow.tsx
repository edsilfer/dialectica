import React, { useContext } from 'react'
import { css } from '@emotion/react'
import ExpandButton from '../../diff-viewer/file-viewer/ExpandButton'
import { DirRowProps } from './types'
import FSNode from './FSNode'
import { highlightText } from '../utils'
import { ThemeContext } from '../../shared/providers/theme-provider'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    directoryContent: css`
      .highlighted-text {
        background-color: ${theme.colors.textPrimary}20;
        border: 1px solid ${theme.colors.textPrimary}40;
        border-radius: 2px;
        padding: 1px 2px;
      }
    `,
  }
}

/**
 * DirectoryRow component renders a single directory row in the file explorer.
 *
 * This component displays a directory entry with:
 * - An expand/collapse button to toggle directory visibility
 * - The directory name
 * - Proper indentation based on nesting level
 * - Visual indicators for selection state and tree structure
 *
 * The component handles click events to toggle directory expansion and
 * integrates with the file explorer's visual hierarchy system.
 */
const DirectoryRow: React.FC<DirRowProps> = (props) => {
  const config = props.config
  const styles = useStyles()

  return (
    <FSNode
      config={config}
      level={props.level}
      isLast={props.isLast}
      isSelected={props.isSelected}
      className={props.className}
      onClick={() => props.onDirectoryToggle?.(props.currentPath, props.collapsed)}
      rowPaddingLeftExtra={props.level * config.indentPx + 6}
      verticalConnectorTop={-10}
    >
      <div css={styles.directoryContent}>
        <ExpandButton
          collapsed={props.collapsed}
          size={14}
          tooltipTextExpand="Expand directory"
          tooltipTextCollapse="Collapse directory"
        />
        <span>{highlightText(props.displayName, props.highlightString || '')}</span>
      </div>
    </FSNode>
  )
}

export default DirectoryRow
