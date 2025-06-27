import React from 'react'
import ExpandButton from '../../diff-viewer/file-viewer/ExpandButton'
import { DirRowProps } from './types'
import FSNode from './FSNode'

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
      <ExpandButton
        collapsed={props.collapsed}
        size={14}
        tooltipTextExpand="Expand directory"
        tooltipTextCollapse="Collapse directory"
      />
      <span>{props.displayName}</span>
    </FSNode>
  )
}

export default DirectoryRow
