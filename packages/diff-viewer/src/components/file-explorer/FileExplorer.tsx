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

export const FileExplorer: React.FC<FileExplorerProps> = (props) => {
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
}

/**
 * Intermediate layer that ensures the configuration provider exists.
 */
const FileExplorerInner: React.FC<FileExplorerProps> = (props) => {
  return (
    <FSTreeContextProvider diff={props.diff}>
      <FileExplorerContent {...props} />
    </FSTreeContextProvider>
  )
}

/**
 * The actual file explorer content.
 */
const FileExplorerContent: React.FC<FileExplorerProps> = (props) => {
  const styles = useStyles()
  const { setSelectedNode, setExpandedDirs, tree } = useFileExplorerContext()

  const containerRef = useRef<HTMLDivElement>(null)

  const handleDirectoryToggle = (path: string, expanded: boolean) => {
    props.onDirectoryToggle?.(path, expanded)
  }

  const handleFileClick = (file: FileDiff) => {
    const filePath = file.newPath || file.oldPath
    setSelectedNode(filePath)
    props.onFileClick?.(file)
  }

  return (
    <div css={[styles.container, props.css]} className={props.className}>
      <ExplorerBar
        onExpandAll={() => setExpandedDirs(listDirPaths(tree))}
        onCollapseAll={() => setExpandedDirs(new Set<string>())}
      />

      <div css={styles.fsTreeContainer} ref={containerRef}>
        <TreeSkeleton containerRef={containerRef} />
        {Array.from(tree.children.values())
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
          ))}
      </div>
    </div>
  )
}
