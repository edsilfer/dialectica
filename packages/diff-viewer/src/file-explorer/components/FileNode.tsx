import { css } from '@emotion/react'
import React, { useContext } from 'react'
import File from '../../shared/components/icons/File'
import FSNode from './FSNode'
import { FileNodeProps } from './types'
import FileActivitySummary from '../../shared/components/activity-summary/FileActivitySummary'
import { ThemeContext } from '../../shared/providers/theme-provider'
import { highlightText } from '../utils'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    content: css`
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 6px;
    `,

    fileContainer: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.xs};
    `,

    iconContainer: css`
      z-index: 100;
    `,
  }
}

const FileNode: React.FC<FileNodeProps> = (props) => {
  const styles = useStyles()

  return (
    <FSNode
      config={props.config}
      level={props.level}
      isLast={props.isLast}
      isSelected={props.isSelected}
      css={props.css}
      className={props.className}
      onClick={() => props.onFileClick?.(props.node.file)}
      rowPaddingLeftExtra={props.level * props.config.indentPx + 6}
      verticalConnectorTop={-12}
      highlightString={props.highlightString}
    >
      <div css={styles.content}>
        {props.config.showIcons && (
          <div css={styles.iconContainer}>
            <File size={14} />
          </div>
        )}
        <div css={styles.fileContainer}>
          <span>{highlightText(props.node.name, props.highlightString || '')}</span>
          {props.config.displayNodeDetails && <FileActivitySummary file={props.node.file} />}
        </div>
      </div>
    </FSNode>
  )
}

export default FileNode
