import { css } from '@emotion/react'
import React from 'react'
import File from '../../shared/components/icons/File'
import FSNode from './FSNode'
import { FileNodeProps } from './types'

const useStyles = () => {
  return {
    content: css`
      display: flex;
      flex-direction: row;
      align-items: center;
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
      displayName={props.node.name}
      highlightString={props.highlightString}
    >
      <div css={styles.content}>
        {props.config.showIcons && (
          <div css={styles.iconContainer}>
            <File size={14} />
          </div>
        )}
      </div>
    </FSNode>
  )
}

export default FileNode
