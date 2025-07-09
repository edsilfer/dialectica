import { css } from '@emotion/react'
import { Dropdown, MenuProps, message, theme } from 'antd'
import React, { useCallback, useContext, useMemo } from 'react'
import { ThemeContext } from '../../../themes/providers/theme-context'
import RichTooltip from '../../ui/RichTooltip'
import ExpandButton from '../../ui/buttons/ExpandButton'
import { highlightText, nodeComparator } from '../../../utils/node-utils'
import { useFileExplorerContext } from '../providers/fstree-context'
import NodeMetadata from './NodeMetadata'
import { FSNodeProps } from './types'

const { useToken } = theme

const useStyles = (level: number) => {
  const theme = useContext(ThemeContext)
  const { token: antdTheme } = useToken()

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
          background-color: ${antdTheme.colorBgTextHover};

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 5px;
            height: 100%;
            background-color: ${theme.colors.accent};
            border-radius: ${theme.spacing.sm} 0 0 ${theme.spacing.sm};
          }
        `
        : ''}

      &:hover {
        border-radius: ${theme.spacing.sm};
        background-color: ${antdTheme.colorBgTextHover};
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
      border: 1px solid ${theme.colors.border};
      padding: 1px ${theme.spacing.xs};
      border-radius: ${theme.spacing.xs};
      color: ${theme.colors.textPrimaryPlaceholder};
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
  const { config, selectedNode, expandedDirs, searchQuery, setSelectedNode, setExpandedDirs } = useFileExplorerContext()
  const styles = useStyles(level)

  const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name
  const isDirectory = node.type === 'directory'
  const filePath = isDirectory ? undefined : node.file.newPath || node.file.oldPath

  const collapsed = isDirectory ? !expandedDirs.has(currentPath) : false
  const isSelected = selectedNode === (isDirectory ? currentPath : filePath)
  const baseIndentPx = level * config.indentPx
  // File don't have an expand button, hence we need to count 20 for it
  const indentPx = isDirectory ? baseIndentPx : baseIndentPx + 20

  const highlightedName = useMemo(() => highlightText(node.name, searchQuery || ''), [node.name, searchQuery])

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
      if (collapsed) {
        next.add(currentPath)
      } else {
        next.delete(currentPath)
      }
      return next
    })
    if (onDirectoryToggle) {
      onDirectoryToggle(currentPath, !collapsed)
    }
  }, [collapsed, currentPath, isDirectory, onDirectoryToggle, setExpandedDirs, setSelectedNode])

  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      if (isDirectory) {
        toggleDirectory()
        return
      }
      if (!isDirectory && filePath) {
        setSelectedNode(filePath)
        if (onFileClick) {
          onFileClick(node.file)
        }
      }
    },
    [filePath, isDirectory, node, onFileClick, setSelectedNode, toggleDirectory],
  )

  const nodePath = isDirectory ? currentPath : filePath || currentPath

  const onMenuClick = useCallback(
    ({ key }: { key: string | number }) => {
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
    },
    [nodePath],
  )

  const menuProps: MenuProps = useMemo(
    () => ({
      items: [
        {
          key: 'copy',
          label: <span style={{ color: theme.colors.textPrimary }}>Copy path</span>,
        },
      ],
      onClick: onMenuClick,
      style: {
        backgroundColor: theme.colors.backgroundContainer,
        color: theme.colors.textPrimary,
      },
    }),
    [onMenuClick, theme],
  )

  return (
    <div>
      <Dropdown menu={menuProps} trigger={['contextMenu']}>
        <div css={[styles.row(isSelected), cssProp]} className={className} onClick={handleRowClick} data-depth={level}>
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
