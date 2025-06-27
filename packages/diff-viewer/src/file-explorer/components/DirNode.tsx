import React from 'react'
import { css } from '@emotion/react'
import { sortNodes } from '../utils'
import FileNode from './FileNode'
import { DirNodeProps } from './types'
import DirectoryRow from './DirectoryRow'

const useStyles = () => {
  return {
    wrapper: css`
      position: relative;
    `,
  }
}

const DirNode: React.FC<DirNodeProps> = (props) => {
  const currentPath = props.parentPath ? `${props.parentPath}/${props.node.name}` : props.node.name
  const collapsed = !props.expandedDirs.has(currentPath)
  const styles = useStyles()

  return (
    <div key={currentPath} css={styles.wrapper}>
      <DirectoryRow
        currentPath={currentPath}
        collapsed={collapsed}
        level={props.level}
        isLast={props.isLast}
        config={props.config}
        displayName={props.node.name || (props.parentPath === '' ? '/' : '')}
        isSelected={props.isSelected}
        className={props.className}
        onDirectoryToggle={props.onDirectoryToggle}
        cssProp={props.css}
      />

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
              />
            )
          })}
    </div>
  )
}

export default DirNode
