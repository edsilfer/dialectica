import { css } from '@emotion/react'
import React, { useContext, useRef } from 'react'
import { useDiffViewerConfig } from '../diff-viewer/providers/diff-viewer-context'
import { ThemeContext } from '../../themes/providers/theme-context'
import FSNode from './components/FSNode'
import { ExplorerBar } from './components/Toolbar'
import TreeSkeleton from './components/TreeSkeleton'
import { listDirPaths, nodeComparator } from './node-utils'
import { FileExplorerConfigProvider, useFileExplorerConfig } from './provider/file-explorer-context'
import { FSTreeContextProvider, useFileExplorerContext } from './provider/fstree-context'
import { FileExplorerProps } from './types'
import { FileDiff } from '../../models/FileDiff'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
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

// Optimized: Memoize FileExplorer to prevent re-renders during resize operations
export const FileExplorer = React.memo<FileExplorerProps>((props: FileExplorerProps) => {
  let hasSpecificProvider = true
  try {
    void useFileExplorerConfig()
  } catch {
    hasSpecificProvider = false
  }

  let inheritedConfig
  try {
    const diffViewerConfig = useDiffViewerConfig()
    inheritedConfig = diffViewerConfig.fileExplorerConfig
  } catch {
    inheritedConfig = undefined
  }

  const explorer = <FileExplorerInner {...props} />

  if (hasSpecificProvider) {
    return explorer
  }

  // Otherwise create a provider, seeding it with any config we could inherit.
  return <FileExplorerConfigProvider config={inheritedConfig}>{explorer}</FileExplorerConfigProvider>
})

FileExplorer.displayName = 'FileExplorer'

/**
 * Intermediate layer that ensures the configuration provider exists.
 * Optimized: Memoized to prevent unnecessary re-renders
 */
const FileExplorerInner = React.memo<FileExplorerProps>(
  ({ diff, onDirectoryToggle, onFileClick, css: customCss, className }: FileExplorerProps) => {
    return (
      <FSTreeContextProvider diff={diff}>
        <FileExplorerContent
          onDirectoryToggle={onDirectoryToggle}
          onFileClick={onFileClick}
          css={customCss}
          className={className}
        />
      </FSTreeContextProvider>
    )
  },
)

FileExplorerInner.displayName = 'FileExplorerInner'

/**
 * The actual file explorer content.
 */
const FileExplorerContent = React.memo<Omit<FileExplorerProps, 'diff'>>(
  ({ onDirectoryToggle, onFileClick, css: customCss, className }: Omit<FileExplorerProps, 'diff'>) => {
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
      (file: FileDiff) => {
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
