import { css } from '@emotion/react'
import React, { useContext, useMemo } from 'react'
import ExpandButton from '../../diff-viewer/components/file-viewer/ExpandButton'
import Directory from '../../shared/components/icons/Directory'
import RichTooltip from '../../shared/components/RichTooltip'
import { ThemeContext } from '../../shared/providers/theme-provider'
import { getFilesForDir, highlightText, sortNodes } from '../utils'
import FileNode from './FileNode'
import FSNode from './FSNode'
import { DirNameProps, DirNodeProps } from './types'

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
  const currentPath = props.parentPath ? `${props.parentPath}/${props.node.name}` : props.node.name
  const collapsed = !props.expandedDirs.has(currentPath)
  const styles = useStyles()
  const theme = useContext(ThemeContext)

  const files = useMemo(() => getFilesForDir(props.node), [props.node])

  return (
    <div key={currentPath} css={styles.wrapper}>
      <FSNode
        config={props.config}
        level={props.level}
        isLast={props.isLast}
        isSelected={props.isSelected}
        className={props.className}
        onClick={() => props.onDirectoryToggle?.(currentPath, collapsed)}
        rowPaddingLeftExtra={props.level * props.config.indentPx + 6}
        verticalConnectorTop={-10}
        highlightString={props.highlightString}
        css={props.css}
      >
        <div css={styles.content}>
          <ExpandButton
            collapsed={collapsed}
            size={14}
            tooltipTextExpand="Expand directory"
            tooltipTextCollapse="Collapse directory"
          />
          {props.config.showIcons && (
            <Directory
              size={14}
              solid
              css={css`
                color: ${theme.colors.accentColor};
              `}
            />
          )}
          <DirName
            showDetails={props.config.displayNodeDetails}
            fileCount={files.length}
            name={props.node.name || (props.parentPath === '' ? '/' : '')}
            highlightString={props.highlightString}
          />
        </div>
      </FSNode>

      {!collapsed &&
        Array.from(props.node.children.values())
          .sort(sortNodes)
          .map((child, idx, arr) => {
            const isLast = idx === arr.length - 1

            if (child.type === 'file') {
              const filePath = child.file.newPath || child.file.oldPath
              return (
                <FileNode
                  config={props.config}
                  key={`${currentPath}/${child.name}`}
                  node={child}
                  level={props.level + 1}
                  isLast={isLast}
                  parentPath={currentPath}
                  isSelected={props.isNodeSelected ? props.isNodeSelected(filePath) : false}
                  onFileClick={props.onFileClick}
                  highlightString={props.highlightString}
                />
              )
            }
            const childPath = `${currentPath}/${child.name}`
            return (
              <DirNode
                config={props.config}
                key={`${currentPath}/${child.name}`}
                node={child}
                level={props.level + 1}
                isLast={isLast}
                parentPath={currentPath}
                expandedDirs={props.expandedDirs}
                isSelected={props.isNodeSelected ? props.isNodeSelected(childPath) : false}
                selectedNode={props.selectedNode}
                isNodeSelected={props.isNodeSelected}
                onFileClick={props.onFileClick}
                onDirectoryToggle={props.onDirectoryToggle}
                highlightString={props.highlightString}
              />
            )
          })}
    </div>
  )
}

const DirName: React.FC<DirNameProps> = ({
  showDetails: displayNodeDetails,
  fileCount,
  name,
  highlightString,
}) => {
  const styles = useStyles()
  const fileCountText = `${fileCount} file${fileCount !== 1 ? 's' : ''}`

  return (
    <RichTooltip
      tooltipText={`There ${fileCount === 1 ? 'is' : 'are'} ${fileCountText} in this directory`}
    >
      <div css={styles.dirContainer}>
        {displayNodeDetails && (
          <span css={styles.fileCount} title={`${fileCount} file${fileCount !== 1 ? 's' : ''}`}>
            {fileCount}
          </span>
        )}
        <span>{highlightText(name, highlightString || '')}</span>
      </div>
    </RichTooltip>
  )
}

export default DirNode
