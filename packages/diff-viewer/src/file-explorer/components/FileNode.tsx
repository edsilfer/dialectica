import { css, Interpolation, Theme } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../shared/providers/theme-provider'
import type { FileExplorerConfig, FileNode } from '../types'

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
    fileBullet: css`
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: ${theme.colors.textPrimary};
      margin-right: ${theme.spacing.xs};
    `,
  }
}

export interface FileExplorerFileNodeProps {
  /** Configuration options for the file explorer */
  config: FileExplorerConfig
  /** The file node to render */
  node: FileNode
  /** The nesting level of this node */
  level: number
  /** The parent path for building the current path */
  parentPath: string
  /** Optional css-in-js style */
  css?: Interpolation<Theme>
  /** Optional class name */
  className?: string

  // Callbacks ____________________________________________
  /** Called when the file entry is clicked */
  onFileClick?: (file: FileNode['file']) => void
}

const FileNode: React.FC<FileExplorerFileNodeProps> = (props) => {
  const styles = useStyles()
  const currentPath = props.parentPath ? `${props.parentPath}/${props.node.name}` : props.node.name

  return (
    <div
      key={currentPath}
      css={[styles.row, props.css]}
      className={props.className}
      style={{ paddingLeft: props.level * props.config.indentPx }}
      onClick={() => props.onFileClick?.(props.node.file)}
    >
      <span css={styles.fileBullet} />
      <span>{props.node.name}</span>
    </div>
  )
}

export default FileNode
