import { css, Interpolation, Theme } from '@emotion/react'
import React, { useContext, useMemo, useState } from 'react'
import { ThemeContext } from '../shared/providers/theme-provider'
import type { FileDiff, ParsedDiff } from '../diff-viewer/types'
import { buildTree, sortNodes } from './utils'
import DirNode from './components/DirNode'
import FileNode from './components/FileNode'
import { FileExplorerConfig } from './types'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
      color: ${theme.colors.textPrimary};
      font-family: ${theme.typography.regularFontFamily};
      font-size: ${theme.typography.regularFontSize}px;
    `,
  }
}

const DEFAULT_CONFIG: FileExplorerConfig = {
  startExpanded: true,
  nodeConnector: 'solid',
  indentPx: 16,
}

export interface FileExplorerProps {
  /** Parsed diff used to build the tree */
  diff: ParsedDiff
  /** Configuration options for the file explorer */
  config?: FileExplorerConfig
  /** Optional css-in-js style */
  css?: Interpolation<Theme>
  /** Optional class name */
  className?: string

  // Callbacks ____________________________________________
  /** Called when a file entry is clicked */
  onFileClick?: (file: FileDiff) => void
  /** Called when a directory entry is toggled */
  onDirectoryToggle?: (path: string, expanded: boolean) => void
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  diff,
  config = DEFAULT_CONFIG,
  css: customCss,
  className,
  onFileClick,
  onDirectoryToggle,
}) => {
  const styles = useStyles()
  const tree = useMemo(() => buildTree(diff.files), [diff.files])

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

  return (
    <div css={[styles.container, customCss]} className={className}>
      {Array.from(tree.children.values())
        .sort(sortNodes)
        .map((node) => {
          if (node.type === 'file') {
            return (
              <FileNode
                key={node.name}
                config={config}
                node={node}
                level={0}
                parentPath=""
                onFileClick={onFileClick}
              />
            )
          }

          return (
            <DirNode
              key={node.name}
              config={config}
              node={node}
              level={0}
              parentPath=""
              expandedDirs={expandedDirs}
              onFileClick={onFileClick}
              onDirectoryToggle={handleDirectoryToggle}
            />
          )
        })}
    </div>
  )
}
