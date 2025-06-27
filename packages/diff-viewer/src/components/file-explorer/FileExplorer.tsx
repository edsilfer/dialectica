import { css, Interpolation, Theme } from '@emotion/react'
import React, { useContext, useMemo, useState } from 'react'
import { ThemeContext } from '../../providers/theme-provider'
import type { FileDiff, ParsedDiff } from '../../types/diff'
import { buildTree, sortNodes } from './file-utils'
import DirNode from './DirNode'
import FileNode from './FileNode'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
      border: 1px solid ${theme.colors.borderBg};
      border-radius: ${theme.spacing.xs};
      font-family: ${theme.typography.regularFontFamily};
      color: ${theme.colors.textPrimary};
      font-size: ${theme.typography.regularFontSize}px;
      overflow: hidden;
    `,
  }
}

export interface FileExplorerProps {
  /** Parsed diff used to build the tree */
  diff: ParsedDiff
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

const FileExplorer: React.FC<FileExplorerProps> = ({
  diff,
  css: cssProp,
  className,
  onFileClick,
  onDirectoryToggle,
}) => {
  const styles = useStyles()
  const tree = useMemo(() => buildTree(diff.files), [diff.files])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const indentPx = 16

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
    <div css={[styles.container, cssProp]} className={className}>
      {Array.from(tree.children.values())
        .sort(sortNodes)
        .map((node) => {
          if (node.type === 'file') {
            return (
              <FileNode
                key={node.name}
                node={node}
                level={0}
                indentPx={indentPx}
                parentPath=""
                onFileClick={onFileClick}
              />
            )
          }

          return (
            <DirNode
              key={node.name}
              node={node}
              level={0}
              indentPx={indentPx}
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

export default FileExplorer
