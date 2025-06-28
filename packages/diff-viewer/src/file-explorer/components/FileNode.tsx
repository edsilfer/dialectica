import { css } from '@emotion/react'
import React, { useContext } from 'react'
import File from '../../shared/components/icons/File'
import FSNode from './FSNode'
import { FileNodeProps } from './types'
import FileActivitySummary from '../../shared/components/activity-summary/FileActivitySummary'
import { ThemeContext } from '../../shared/providers/theme-provider'
import { highlightText } from '../node-utils'
import { useFileExplorerContext } from '../provider/file-explorer-context'

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
  const { config, selectedNode, searchQuery: highlightString } = useFileExplorerContext()
  const filePath = props.node.file.newPath || props.node.file.oldPath
  const isSelected = selectedNode === filePath

  return (
    <FSNode
      level={props.level}
      isLast={props.isLast}
      isSelected={isSelected}
      css={props.css}
      className={props.className}
      onClick={() => props.onFileClick?.(props.node.file)}
      rowPaddingLeftExtra={props.level * config.indentPx + 6}
      verticalConnectorTop={-12}
    >
      <div css={styles.content}>
        {config.showIcons && (
          <div css={styles.iconContainer}>
            <File size={14} />
          </div>
        )}
        <div css={styles.fileContainer}>
          <span>{highlightText(props.node.name, highlightString || '')}</span>
          {config.displayNodeDetails && <FileActivitySummary file={props.node.file} />}
        </div>
      </div>
    </FSNode>
  )
}

export default FileNode
