import { ThemeContext } from '@commons'
import { css, Interpolation, Theme } from '@emotion/react'
import React, { memo, useContext, useRef } from 'react'
import { FSNode } from './components/FSNode'
import { ExplorerBar } from './components/Toolbar'
import { TreeSkeleton } from './components/TreeSkeleton'
import { FileMetadata } from './models/FileMetadata'
import { FileExplorerConfigProvider, useFileExplorerConfig } from './providers/file-explorer-context'
import { FSTreeContextProvider, useFileExplorerContext } from './providers/fstree-context'
import { listDirPaths, nodeComparator } from './utils/node-utils'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: ${theme.colors.fileExplorerBg};
      color: ${theme.colors.textPrimary};
      font-family: ${theme.typography.regularFontFamily};
      font-size: ${theme.typography.regularFontSize}px;
      overflow: hidden;
    `,

    fsTreeContainer: css`
      overflow: auto;
      flex: 1;
      position: relative;
    `,
  }
}

export interface FileExplorerProps {
  /** Parsed diff used to build the tree */
  files: FileMetadata[]
  /** Optional css-in-js style */
  css?: Interpolation<Theme>
  /** Optional class name */
  className?: string

  /** Called when a file entry is clicked */
  onFileClick?: (file: FileMetadata) => void
  /** Called when a directory entry is toggled */
  onDirectoryToggle?: (path: string, expanded: boolean) => void
}

// Optimized: Memoize FileExplorer to prevent re-renders during resize operations
export const FileExplorer = memo<FileExplorerProps>((props: FileExplorerProps) => {
  let hasSpecificProvider = true
  try {
    void useFileExplorerConfig()
  } catch {
    hasSpecificProvider = false
  }

  const explorer = <FileExplorerInner {...props} />

  if (hasSpecificProvider) {
    return explorer
  }

  return <FileExplorerConfigProvider>{explorer}</FileExplorerConfigProvider>
})

FileExplorer.displayName = 'FileExplorer'

/**
 * Intermediate layer that ensures the configuration provider exists.
 * Optimized: Memoized to prevent unnecessary re-renders
 */
const FileExplorerInner = memo((props: FileExplorerProps) => {
  return (
    <FSTreeContextProvider files={props.files}>
      <FileExplorerContent {...props} />
    </FSTreeContextProvider>
  )
})

FileExplorerInner.displayName = 'FileExplorerInner'

/**
 * The actual file explorer content.
 */
const FileExplorerContent = memo<Omit<FileExplorerProps, 'files'>>(
  ({ onDirectoryToggle, onFileClick, css: customCss, className }: Omit<FileExplorerProps, 'files'>) => {
    const styles = useStyles()
    const { setSelectedNode, setExpandedDirs, tree } = useFileExplorerContext()

    const containerRef = useRef<HTMLDivElement>(null)

    const handleDirectoryToggle = React.useCallback(
      (path: string, expanded: boolean) => {
        onDirectoryToggle?.(path, expanded)
      },
      [onDirectoryToggle],
    )

    const handleFileClick = React.useCallback(
      (file: FileMetadata) => {
        const filePath = file.newPath || file.oldPath
        setSelectedNode(filePath)
        onFileClick?.(file)
      },
      [onFileClick, setSelectedNode],
    )

    const treeNodes = React.useMemo(() => {
      return Array.from(tree.children.values())
        .sort(nodeComparator)
        .map((node) => (
          <FSNode
            key={node.name}
            node={node}
            level={0}
            parentPath=""
            onFileClick={handleFileClick}
            onDirectoryToggle={handleDirectoryToggle}
          />
        ))
    }, [tree.children, handleFileClick, handleDirectoryToggle])

    return (
      <div css={[styles.container, customCss]} className={className}>
        <ExplorerBar
          onExpandAll={() => setExpandedDirs(listDirPaths(tree))}
          onCollapseAll={() => setExpandedDirs(new Set<string>())}
        />

        <div css={styles.fsTreeContainer} ref={containerRef}>
          <TreeSkeleton containerRef={containerRef} />
          {treeNodes}
        </div>
      </div>
    )
  },
)

FileExplorerContent.displayName = 'FileExplorerContent'
