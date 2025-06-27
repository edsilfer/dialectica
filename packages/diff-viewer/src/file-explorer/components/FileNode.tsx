import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../shared/providers/theme-provider'
import type { FileExplorerConfig, FileNode } from '../types'
import { FileNodeProps } from './types'

const useStyles = (config: FileExplorerConfig) => {
  const theme = useContext(ThemeContext)

  return {
    row: (isSelected?: boolean) => css`
      display: flex;
      flex-direction: row;
      padding: ${theme.spacing.xs};
      padding-left: ${theme.spacing.sm};
      align-items: center;
      user-select: none;
      cursor: pointer;
      position: relative;

      ${isSelected
        ? `
        border-radius: ${theme.spacing.sm};
        background-color: ${theme.colors.fileViewerHeaderBg};

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 5px;
          height: 100%;
          background-color: ${theme.colors.accentColor};
          border-radius: ${theme.spacing.sm} 0 0 ${theme.spacing.sm};
        }

      `
        : ''}

      &:hover {
        background-color: ${theme.colors.fileViewerHeaderBg};
      }
    `,

    verticalConnector: (level: number) => css`
      position: absolute;
      border-left: 1px solid ${theme.colors.fileExplorerlineConnectorBg};
      top: -12px;
      height: 100%;
      z-index: 100;
      left: ${level * config.indentPx + 12}px;
    `,

    horizontalConnector: (level: number) => css`
      position: absolute;
      border-top: 1px solid ${theme.colors.fileExplorerlineConnectorBg};
      left: ${(level - 1) * config.indentPx + 12}px;
      width: ${level > 0 ? config.indentPx - 6 : 0}px;
      z-index: 100;
    `,

    content: (level: number) => css`
      display: flex;
      flex-direction: row;
      align-items: center;
      padding-left: ${level * config.indentPx}px;
    `,

    fileBullet: css`
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: ${theme.colors.textPrimary};
      margin-right: ${theme.spacing.xs};
      z-index: 100;
    `,
  }
}

const FileNode: React.FC<FileNodeProps> = (props) => {
  const styles = useStyles(props.config)
  const connectorCount = props.isLast ? props.level : props.level
  const currentPath = props.parentPath ? `${props.parentPath}/${props.node.name}` : props.node.name

  return (
    <div
      key={currentPath}
      css={[styles.row(props.isSelected), props.css]}
      className={props.className}
      onClick={() => props.onFileClick?.(props.node.file)}
    >
      {/* Vertical connector */}
      {Array.from({ length: connectorCount }).map((_, index) => (
        <div key={index} css={styles.verticalConnector(index)} />
      ))}

      {/* Horizontal connector */}
      <div css={styles.horizontalConnector(props.level)} />

      <div css={styles.content(props.level)}>
        <span css={styles.fileBullet} />
        <span>{props.node.name}</span>
      </div>
    </div>
  )
}

export default FileNode
