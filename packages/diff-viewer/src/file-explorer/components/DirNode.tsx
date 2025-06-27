import { css } from '@emotion/react'
import React, { useContext } from 'react'
import ExpandButton from '../../diff-viewer/file-viewer/ExpandButton'
import { ThemeContext } from '../../shared/providers/theme-provider'
import type { FileExplorerConfig } from '../types'
import { sortNodes } from '../utils'
import FileNode from './FileNode'
import { DirRowProps, DirNodeProps } from './types'

const useStyles = (config: FileExplorerConfig) => {
  const theme = useContext(ThemeContext)

  return {
    wrapper: css`
      position: relative;
    `,

    row: (level: number, indentPx: number, isSelected?: boolean) => css`
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: ${theme.spacing.xs};
      padding: ${theme.spacing.sm};
      padding-left: ${level * indentPx + 6}px;
      cursor: pointer;
      position: relative;
      color: ${theme.colors.textPrimary};

      ${isSelected
        ? `
        border-radius: ${theme.spacing.sm};
        background-color: ${theme.colors.fileExplorerSelectedFileBg};

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
        border-radius: ${theme.spacing.sm};
        background-color: ${theme.colors.fileExplorerSelectedFileBg};
      }
    `,

    verticalConnector: (level: number) => css`
      position: absolute;
      border-left: 1px solid ${theme.colors.fileExplorerlineConnectorBg};
      top: -10px;
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
  }
}

const DirNode: React.FC<DirNodeProps> = (props) => {
  const currentPath = props.parentPath ? `${props.parentPath}/${props.node.name}` : props.node.name
  const collapsed = !props.expandedDirs.has(currentPath)
  const styles = useStyles(props.config)

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
        cssProp={props.css}
        className={props.className}
        onDirectoryToggle={props.onDirectoryToggle}
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

const DirectoryRow: React.FC<DirRowProps> = (props) => {
  const styles = useStyles(props.config)
  const connectorCount = props.isLast ? props.level : props.level

  return (
    <div
      css={[styles.row(props.level, props.config.indentPx, props.isSelected), props.cssProp]}
      className={props.className}
      onClick={() => props.onDirectoryToggle?.(props.currentPath, props.collapsed)}
    >
      <ExpandButton
        collapsed={props.collapsed}
        size={14}
        tooltipTextExpand="Expand directory"
        tooltipTextCollapse="Collapse directory"
      />

      {/* Vertical connector */}
      {Array.from({ length: connectorCount }).map((_, index) => (
        <div key={index} css={styles.verticalConnector(index)} />
      ))}

      {/* Horizontal connector */}
      <div css={styles.horizontalConnector(props.level)} />

      <span>{props.displayName}</span>
    </div>
  )
}

export default DirNode
