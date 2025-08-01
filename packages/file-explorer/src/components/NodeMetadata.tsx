import { DirectoryIcon, FileIcon, ThemeContext } from '@edsilfer/commons'
import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { DirectoryNode, FileNode } from '../models/Nodes'
import { listFilesIn } from '../utils/node-utils'
import { NodeMetadataProps } from './types'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    /* Style for the metadata label */
    metadataTitle: (color: string) => css`
      min-width: 25px;
      font-size: 0.65rem !important;
      color: ${color};
      border: 1px solid ${color};
      padding: 1px ${theme.spacing.xs};
      border-radius: ${theme.spacing.xs};
      text-align: center;
    `,

    /* Style for the directory icon */
    directoryIcon: css`
      color: ${theme.colors.accent};
    `,
  }
}

export const NodeMetadata: React.FC<NodeMetadataProps> = (props) => {
  const theme = useContext(ThemeContext)
  const styles = useStyles()

  if (!props.showIcons && !props.displayDetails) {
    return null
  }

  if (!props.isDirectory) {
    const { showIcons, displayDetails } = props
    const fileNode = props.node as FileNode

    // Determine background color and label based on file diff flags
    let bgColor = theme.colors.fileViewerModifiedSquareBg
    let title = 'Modified file'
    let label = 'M'
    if (fileNode.file.isNew) {
      bgColor = theme.colors.fileViewerAddedSquareBg
      title = 'Added file'
      label = 'A'
    } else if (fileNode.file.isDeleted) {
      bgColor = theme.colors.fileViewerDeletedSquareBg
      title = 'Deleted file'
      label = 'D'
    }

    return (
      <>
        {showIcons && <FileIcon size={14} />}
        {displayDetails && (
          <span css={styles.metadataTitle(bgColor)} title={title}>
            {label}
          </span>
        )}
      </>
    )
  }

  const fileTotal = listFilesIn(props.node as DirectoryNode).length
  return (
    <>
      {props.showIcons && <DirectoryIcon size={14} css={styles.directoryIcon} />}
      {props.displayDetails && (
        <span css={styles.metadataTitle(theme.colors.textPrimaryPlaceholder)} title={`${fileTotal} files`}>
          {fileTotal}
        </span>
      )}
    </>
  )
}
