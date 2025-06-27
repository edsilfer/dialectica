import React, { useContext } from 'react'
import { css } from '@emotion/react'
import { sortNodes } from '../utils'
import FileNode from './FileNode'
import { DirNodeProps } from './types'
import FSNode from './FSNode'
import ExpandButton from '../../diff-viewer/file-viewer/ExpandButton'
import Directory from '../../shared/icons/Directory'
import { ThemeContext } from '../../shared/providers/theme-provider'

const useStyles = () => {
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
  }
}

const DirNode: React.FC<DirNodeProps> = (props) => {
  const currentPath = props.parentPath ? `${props.parentPath}/${props.node.name}` : props.node.name
  const collapsed = !props.expandedDirs.has(currentPath)
  const styles = useStyles()
  const theme = useContext(ThemeContext)

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
        displayName={props.node.name || (props.parentPath === '' ? '/' : '')}
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

export default DirNode
