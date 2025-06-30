import { css } from '@emotion/react'
import React, { useCallback, useContext, useMemo } from 'react'
import ExpandButton from '../../shared/components/buttons/ExpandButton'
import RichTooltip from '../../shared/components/RichTooltip'
import { ThemeContext } from '../../shared/providers/theme-context'
import { highlightText, nodeComparator } from '../node-utils'
import { useFileExplorerContext } from '../provider/fstree-context'
import { FileNode } from '../types'
import { FSNodeProps } from './types'
import { Dropdown, message, MenuProps } from 'antd'
import NodeMetadata from './NodeMetadata'

const useStyles = (level: number) => {
  const theme = useContext(ThemeContext)

  return {
    row: (isSelected?: boolean) => css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};
      padding: ${theme.spacing.sm};
      cursor: pointer;
      color: ${theme.colors.textPrimary};
      background-color: ${theme.colors.fileExplorerBg};

      ${level === 0
        ? `
          position: sticky;
          top: 0;
          z-index: 1000;
        `
        : 'position: relative;'}

      .highlighted-text {
        background-color: ${theme.colors.textPrimary}20;
        border: 1px solid ${theme.colors.textPrimary}40;
        border-radius: 2px;
        padding: 1px 2px;
      }

      ${isSelected
        ? `
          border-radius: ${theme.spacing.sm};
          border: 1px solid ${theme.colors.accentColor};
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

    metadataContainer: css`
      display: flex;
      align-items: center;
      // This is a bit brittle, but we need a fixed width
      min-width: 50px;
      gap: ${theme.spacing.sm};
    `,

    metadataTitle: (color: string) => css`
      min-width: 25px;
      font-size: 0.65rem !important;
      color: ${color};
      border: 1px solid ${color};
      padding: 1px ${theme.spacing.xs};
      border-radius: ${theme.spacing.xs};
      text-align: center;
    `,

    content: (paddingLeft: number) => css`
      display: flex;
      align-items: center;
      justify-content: center;
      gap: ${theme.spacing.xs};
      padding-left: ${paddingLeft}px;
    `,

    fileCount: css`
      border: 1px solid ${theme.colors.borderBg};
      padding: 1px ${theme.spacing.xs};
      border-radius: ${theme.spacing.xs};
      color: ${theme.colors.placeholderText};
      text-align: center;
    `,
  }
}

const FSNode: React.FC<FSNodeProps> = ({
  node,
  level,
  parentPath,
  css: cssProp,
  className,
  onDirectoryToggle,
  onFileClick,
}) => {
  const theme = useContext(ThemeContext)
  const { config, selectedNode, expandedDirs, searchQuery, setSelectedNode, setExpandedDirs } =
    useFileExplorerContext()
  const styles = useStyles(level)

  const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name
  const isDirectory = node.type === 'directory'
  const filePath = isDirectory
    ? undefined
    : (node as FileNode).file.newPath || (node as FileNode).file.oldPath

  const collapsed = isDirectory ? !expandedDirs.has(currentPath) : false
  const isSelected = selectedNode === (isDirectory ? currentPath : filePath)
  const baseIndentPx = level * config.indentPx
  // File don't have an expand button, hence we need to count 20 for it
  const indentPx = isDirectory ? baseIndentPx : baseIndentPx + 20

  const highlightedName = useMemo(
    () => highlightText(node.name, searchQuery || ''),
    [node.name, searchQuery],
  )

  const metadata = useMemo(
    () => (
      <NodeMetadata
        node={node}
        isDirectory={isDirectory}
        showIcons={config.showIcons}
        displayDetails={config.displayNodeDetails}
      />
    ),
    [config.displayNodeDetails, config.showIcons, isDirectory, node],
  )

  const toggleDirectory = useCallback(() => {
    if (!isDirectory) return
    setSelectedNode(currentPath)
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      collapsed ? next.add(currentPath) : next.delete(currentPath)
      return next
    })
    onDirectoryToggle?.(currentPath, !collapsed)
  }, [collapsed, currentPath, isDirectory, onDirectoryToggle, setExpandedDirs, setSelectedNode])

  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      if (isDirectory) {
        toggleDirectory()
        return
      }
      if (filePath) {
        setSelectedNode(filePath)
        onFileClick?.((node as FileNode).file)
      }
    },
    [filePath, isDirectory, node, onFileClick, setSelectedNode, toggleDirectory],
  )

  const nodePath = isDirectory ? currentPath : filePath || currentPath

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'copy') {
      navigator.clipboard
        .writeText(nodePath)
        .then(() => {
          message.success('Path copied to clipboard')
        })
        .catch(() => {
          message.error('Failed to copy path')
        })
    }
  }

  const menuProps = useMemo(() => {
    return {
      items: [
        {
          key: 'copy',
          label: <span style={{ color: theme.colors.tooltipText }}>Copy path</span>,
        },
      ],
      onClick: onMenuClick,
      style: {
        backgroundColor: theme.colors.tooltipBg,
        color: theme.colors.tooltipText,
      },
    }
  }, [onMenuClick, theme])

  return (
    <div>
      <Dropdown menu={menuProps as any} trigger={['contextMenu']}>
        <div
          css={[styles.row(isSelected), cssProp]}
          className={className}
          onClick={handleRowClick}
          data-depth={level}
        >
          {/* Metadata (icon + details) */}
          <div css={styles.metadataContainer}>{metadata}</div>

          {/* Content (indentation + chevron + name) */}
          <div css={styles.content(indentPx)}>
            {/* Auxiliary element to help the TreeSkeleton calculate the position of the node */}
            <div
              data-fs-node-row
              data-node-level={level}
              data-node-parent-path={parentPath}
              data-node-type={node.type}
              data-node-path={currentPath}
              data-node-collapsed={collapsed}
            />

            {isDirectory && (
              <ExpandButton
                collapsed={collapsed}
                size={14}
                tooltipTextExpand="Expand directory"
                tooltipTextCollapse="Collapse directory"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleDirectory()
                }}
              />
            )}

            <RichTooltip tooltipText={isDirectory ? currentPath : filePath || ''}>
              <span>{highlightedName}</span>
            </RichTooltip>
          </div>
        </div>
      </Dropdown>

      {/* Children */}
      {isDirectory &&
        !collapsed &&
        Array.from(node.children.values())
          .sort(nodeComparator)
          .map((child) => (
            <FSNode
              key={`${currentPath}/${child.name}`}
              node={child}
              level={level + 1}
              parentPath={currentPath}
              onFileClick={onFileClick}
              onDirectoryToggle={onDirectoryToggle}
            />
          ))}
    </div>
  )
}

export default FSNode
