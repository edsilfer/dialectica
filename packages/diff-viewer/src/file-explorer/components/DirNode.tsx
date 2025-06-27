import { css, Interpolation, Theme } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../shared/providers/theme-provider'
import { FileDiff } from '../../diff-viewer/types'
import ExpandButton from '../../diff-viewer/file-viewer/ExpandButton'
import { sortNodes } from '../utils'
import FileNode from './FileNode'
import type { DirectoryNode, FileExplorerConfig, TreeNode } from '../types'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    row: css`
      display: flex;
      flex-direction: row;
      align-items: center;
      user-select: none;
      padding: ${theme.spacing.xs} 0;
      cursor: pointer;

      &:hover {
        background-color: ${theme.colors.fileViewerHeaderBg};
      }
    `,
    expandBtnWrapper: css`
      margin-right: ${theme.spacing.xs};
    `,
  }
}

export interface DirNodeProps {
  /** Configuration options for the file explorer */
  config: FileExplorerConfig
  /** The directory node to render */
  node: DirectoryNode
  /** The nesting level of this node */
  level: number
  /** The parent path for building the current path */
  parentPath: string
  /** Whether the parent directory is expanded */
  expandedDirs: Set<string>
  /** Optional css-in-js style */
  css?: Interpolation<Theme>
  /** Optional class name */
  className?: string

  // Callbacks ____________________________________________
  /** Called when a file entry is clicked */
  onFileClick?: (file: FileDiff) => void
  /** Called when a directory entry is toggled */
  onDirectoryToggle?: (path: string, expanded: boolean) => void
}

const DirNode: React.FC<DirNodeProps> = (props) => {
  const currentPath = props.parentPath ? `${props.parentPath}/${props.node.name}` : props.node.name
  const collapsed = !props.expandedDirs.has(currentPath)

  return (
    <div key={currentPath}>
      <DirectoryRow
        config={props.config}
        currentPath={currentPath}
        collapsed={collapsed}
        level={props.level}
        displayName={props.node.name || (props.parentPath === '' ? '/' : '')}
        cssProp={props.css}
        className={props.className}
        onDirectoryToggle={props.onDirectoryToggle}
      />

      {!collapsed &&
        Array.from(props.node.children.values())
          .sort(sortNodes)
          .map((child: TreeNode) => {
            if (child.type === 'file') {
              return (
                <FileNode
                  config={props.config}
                  key={`${currentPath}/${child.name}`}
                  node={child}
                  level={props.level + 1}
                  parentPath={currentPath}
                  onFileClick={props.onFileClick}
                />
              )
            }
            return (
              <DirNode
                config={props.config}
                key={`${currentPath}/${child.name}`}
                node={child}
                level={props.level + 1}
                parentPath={currentPath}
                expandedDirs={props.expandedDirs}
                onFileClick={props.onFileClick}
                onDirectoryToggle={props.onDirectoryToggle}
              />
            )
          })}
    </div>
  )
}

interface DirectoryRowProps {
  /** Configuration options for the file explorer */
  config: FileExplorerConfig
  /** The current path of the directory */
  currentPath: string
  /** Whether the directory is collapsed */
  collapsed: boolean
  /** The nesting level of this node */
  level: number
  /** The display name of the directory */
  displayName: string

  // Callbacks ____________________________________________
  /** Optional css-in-js style */
  cssProp?: Interpolation<Theme>
  /** Optional class name */
  className?: string
  /** Called when a directory entry is toggled */
  onDirectoryToggle?: (path: string, collapsed: boolean) => void
}

const DirectoryRow: React.FC<DirectoryRowProps> = (props) => {
  const styles = useStyles()

  return (
    <div
      css={[styles.row, props.cssProp]}
      className={props.className}
      style={{ paddingLeft: props.level * props.config.indentPx }}
      onClick={() => props.onDirectoryToggle?.(props.currentPath, props.collapsed)}
    >
      <span css={styles.expandBtnWrapper}>
        <ExpandButton
          collapsed={props.collapsed}
          size={14}
          tooltipTextExpand="Expand directory"
          tooltipTextCollapse="Collapse directory"
        />
      </span>
      <span>{props.displayName}</span>
    </div>
  )
}

export default DirNode
