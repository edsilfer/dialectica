import { css } from '@emotion/react'
import React, { useContext, useMemo } from 'react'
import ExpandButton from '../../diff-viewer/components/file-viewer/ExpandButton'
import Directory from '../../shared/components/icons/Directory'
import RichTooltip from '../../shared/components/RichTooltip'
import { ThemeContext } from '../../shared/providers/theme-provider'
import { listFilesIn, highlightText, nodeComparator } from '../node-utils'
import FileNode from './FileNode'
import FSNode from './FSNode'
import { DirectoryNameProps, DirNodeProps } from './types'
import { useFileExplorerContext } from '../provider/file-explorer-context'

const useStyles = () => {
  const theme = useContext(ThemeContext)
  return {
    wrapper: css`
      position: relative;
    `,
    content: css`
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 4px;
    `,
    dirContainer: css`
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: ${theme.spacing.xs};
    `,
    fileCount: css`
      font-size: 0.75rem;
      border: 1px solid ${theme.colors.borderBg};
      padding: 1px 4px;
      border-radius: 4px;
      color: ${theme.colors.placeholderText};
      min-width: 12px;
      text-align: center;
    `,
  }
}

const DirNode: React.FC<DirNodeProps> = (props) => {
  const {
    config,
    selectedNode,
    searchQuery: highlightString,
    expandedDirs,
  } = useFileExplorerContext()
  const currentPath = props.parentPath ? `${props.parentPath}/${props.node.name}` : props.node.name
  const collapsed = !expandedDirs.has(currentPath)
  const isSelected = selectedNode === currentPath
  const styles = useStyles()
  const theme = useContext(ThemeContext)

  const files = useMemo(() => listFilesIn(props.node), [props.node])

  // Build metadata content (icon + file count)
  const metadata = (
    <>
      {config.showIcons && (
        <Directory
          size={14}
          solid
          css={css`
            color: ${theme.colors.accentColor};
          `}
        />
      )}
      {config.displayNodeDetails && (
        <span css={styles.fileCount} title={`${files.length} files`}>
          {files.length}
        </span>
      )}
    </>
  )

  return (
    <div key={currentPath} css={styles.wrapper}>
      <FSNode
        level={props.level}
        isLast={props.isLast}
        isSelected={isSelected}
        displayName={currentPath}
        metadata={metadata}
        className={props.className}
        onClick={() => props.onDirectoryToggle?.(currentPath, collapsed)}
        rowPaddingLeftExtra={props.level * config.indentPx + 6}
        verticalConnectorTop={-10}
        css={props.css}
      >
        <div css={styles.content}>
          <ExpandButton
            collapsed={collapsed}
            size={14}
            tooltipTextExpand="Expand directory"
            tooltipTextCollapse="Collapse directory"
          />
          <DirectoryName
            showDetails={false /* Details handled in metadata */}
            fileCount={files.length}
            name={props.node.name || (props.parentPath === '' ? '/' : '')}
            fullPath={currentPath}
            highlightString={highlightString}
          />
        </div>
      </FSNode>

      {!collapsed &&
        Array.from(props.node.children.values())
          .sort(nodeComparator)
          .map((child, idx, arr) => {
            const isLast = idx === arr.length - 1

            if (child.type === 'file') {
              return (
                <FileNode
                  key={`${currentPath}/${child.name}`}
                  node={child}
                  level={props.level + 1}
                  isLast={isLast}
                  parentPath={currentPath}
                  onFileClick={props.onFileClick}
                />
              )
            }
            return (
              <DirNode
                key={`${currentPath}/${child.name}`}
                node={child}
                level={props.level + 1}
                isLast={isLast}
                parentPath={currentPath}
                onFileClick={props.onFileClick}
                onDirectoryToggle={props.onDirectoryToggle}
              />
            )
          })}
    </div>
  )
}

const DirectoryName: React.FC<DirectoryNameProps> = (props) => {
  const styles = useStyles()
  const fileCountText = `${props.fileCount} file${props.fileCount !== 1 ? 's' : ''}`
  const tooltipText = (
    <span>
      {`There ${props.fileCount === 1 ? 'is' : 'are'} ${fileCountText} in this directory`}
      <br />
      {props.fullPath}
    </span>
  )

  return (
    <RichTooltip tooltipText={tooltipText}>
      <div css={styles.dirContainer}>
        <span>{highlightText(props.name, props.highlightString || '')}</span>
      </div>
    </RichTooltip>
  )
}

export default DirNode
