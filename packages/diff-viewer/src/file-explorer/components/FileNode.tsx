import FSNode from './FSNode'
import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../shared/providers/theme-provider'
import type { FileExplorerConfig } from '../types'
import { FileNodeProps } from './types'
import { highlightText } from '../utils'

const useStyles = (config: FileExplorerConfig) => {
  const theme = useContext(ThemeContext)

  return {
    content: (level: number) => css`
      display: flex;
      flex-direction: row;
      align-items: center;
      padding-left: ${level * config.indentPx}px;

      .highlighted-text {
        background-color: ${theme.colors.textPrimary}20;
        border: 1px solid ${theme.colors.textPrimary}40;
        border-radius: 2px;
        padding: 1px 2px;
      }
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

  return (
    <FSNode
      config={props.config}
      level={props.level}
      isLast={props.isLast}
      isSelected={props.isSelected}
      css={props.css}
      className={props.className}
      onClick={() => props.onFileClick?.(props.node.file)}
      rowPaddingLeftExtra={0}
      verticalConnectorTop={-12}
    >
      <div css={styles.content(props.level)}>
        <span css={styles.fileBullet} />
        <span>{highlightText(props.node.name, props.highlightString || '')}</span>
      </div>
    </FSNode>
  )
}

export default FileNode
