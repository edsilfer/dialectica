import { css } from '@emotion/react'
import React, { useContext, useMemo, useState } from 'react'
import { ThemeContext } from '../shared/providers/theme-provider'
import { Themes } from '../shared/themes'
import DirNode from './components/DirNode'
import FileNode from './components/FileNode'
import { FileExplorerConfig, FileExplorerProps } from './types'
import { buildTree, sortNodes } from './utils'
import { Input } from 'antd'
import { DiffViewerThemeProvider } from '../shared/providers/theme-provider'

const { Search } = Input

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.sm};
      background-color: ${theme.colors.fileExplorerBg};
      color: ${theme.colors.textPrimary};
      font-family: ${theme.typography.regularFontFamily};
      font-size: ${theme.typography.regularFontSize}px;
    `,

    // Didn't work via token override in the theme provider
    search: css`
      .ant-input-search-button .ant-btn-icon svg {
        color: ${theme.colors.placeholderText};
      }
    `,
  }
}

const DEFAULT_CONFIG: FileExplorerConfig = {
  startExpanded: true,
  nodeConnector: 'solid',
  indentPx: 16,
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  diff,
  config = DEFAULT_CONFIG,
  css: customCss,
  className,
  onFileClick,
  onDirectoryToggle,
}) => {
  return (
    <DiffViewerThemeProvider theme={config.theme || Themes.light}>
      <FileExplorerContent
        diff={diff}
        config={config}
        css={customCss}
        className={className}
        onFileClick={onFileClick}
        onDirectoryToggle={onDirectoryToggle}
      />
    </DiffViewerThemeProvider>
  )
}

const FileExplorerContent: React.FC<FileExplorerProps> = ({
  diff,
  config = DEFAULT_CONFIG,
  css: customCss,
  className,
  onFileClick,
  onDirectoryToggle,
}) => {
  const styles = useStyles()
  const [searchText, setSearchText] = useState('')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // Filter files based on the search text (case-insensitive)
  const filteredFiles = useMemo(() => {
    if (!searchText) return diff.files
    const lower = searchText.toLowerCase()
    return diff.files.filter((file) => {
      const fullPath = (file.newPath || file.oldPath).toLowerCase()
      return fullPath.includes(lower)
    })
  }, [diff.files, searchText])

  // Build tree from the filtered files
  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles])

  // When searching, force expand all directories so the user can see matches
  const searchExpandedDirs = useMemo(() => {
    if (!searchText) return new Set<string>()
    const dirs = new Set<string>()
    const collectDirs = (node: typeof tree, currentPath: string) => {
      if (currentPath) dirs.add(currentPath)
      node.children.forEach((child) => {
        if (child.type === 'directory') {
          const childPath = currentPath ? `${currentPath}/${child.name}` : child.name
          collectDirs(child, childPath)
        }
      })
    }
    collectDirs(tree, '')
    return dirs
  }, [tree, searchText])

  // Handle expanding the initial directories based on the configuration.
  const initialExpandedDirs = useMemo(() => {
    if (!config.startExpanded) return new Set<string>()
    const dirs = new Set<string>()
    const collectDirs = (node: typeof tree, currentPath: string) => {
      if (currentPath) dirs.add(currentPath)
      node.children.forEach((child) => {
        if (child.type === 'directory') {
          const childPath = currentPath ? `${currentPath}/${child.name}` : child.name
          collectDirs(child, childPath)
        }
      })
    }
    collectDirs(tree, '')
    return dirs
  }, [tree, config.startExpanded])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(initialExpandedDirs)

  // Combine the regular expanded dirs with the forced ones when searching
  const effectiveExpandedDirs = useMemo(() => {
    if (!searchText) return expandedDirs
    return new Set<string>([...expandedDirs, ...searchExpandedDirs])
  }, [expandedDirs, searchExpandedDirs, searchText])

  const handleDirectoryToggle = (path: string, expanded: boolean) => {
    setExpandedDirs((prev) => {
      const newSet = new Set(prev)
      if (expanded) {
        newSet.add(path)
      } else {
        newSet.delete(path)
      }
      return newSet
    })
    onDirectoryToggle?.(path, expanded)
  }

  const handleFileClick = (file: any) => {
    const filePath = file.newPath || file.oldPath
    setSelectedNode(filePath)
    onFileClick?.(file)
  }

  const handleDirectoryClick = (path: string, expanded: boolean) => {
    setSelectedNode(path)
    handleDirectoryToggle(path, expanded)
  }

  const isNodeSelected = (nodePath: string) => selectedNode === nodePath

  return (
    <div css={[styles.container, customCss]} className={className}>
      <Search
        placeholder="Filter / Search Files"
        allowClear
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        css={styles.search}
      />

      {Array.from(tree.children.values())
        .sort(sortNodes)
        .map((node, idx, arr) => {
          const isLast = idx === arr.length - 1

          if (node.type === 'file') {
            const filePath = node.file.newPath || node.file.oldPath
            return (
              <FileNode
                key={node.name}
                config={config}
                node={node}
                level={0}
                isLast={isLast}
                parentPath=""
                isSelected={isNodeSelected(filePath)}
                onFileClick={handleFileClick}
              />
            )
          }

          const dirPath = node.name
          return (
            <DirNode
              key={node.name}
              config={config}
              node={node}
              level={0}
              isLast={isLast}
              parentPath=""
              expandedDirs={effectiveExpandedDirs}
              isSelected={isNodeSelected(dirPath)}
              selectedNode={selectedNode}
              isNodeSelected={isNodeSelected}
              onFileClick={handleFileClick}
              onDirectoryToggle={handleDirectoryClick}
            />
          )
        })}
    </div>
  )
}
