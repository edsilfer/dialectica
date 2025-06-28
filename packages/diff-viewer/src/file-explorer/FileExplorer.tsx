import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../shared/providers/theme-provider'
import { Themes } from '../shared/themes'
import FSNode from './components/FSNode'
import { FileExplorerConfig, FileExplorerProps } from './types'
import { nodeComparator, listDirPaths } from './node-utils'
import { DiffViewerThemeProvider } from '../shared/providers/theme-provider'
import { FileExplorerProvider, useFileExplorerContext } from './provider/file-explorer-context'
import { ExplorerBar } from './components/Toolbar'
import TreeSkeleton from './components/TreeSkeleton'

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
      overflow: hidden;
    `,

    fsTreeContainer: css`
      overflow: auto;
      flex: 1;
      position: relative;
    `,
  }
}

const DEFAULT_CONFIG: FileExplorerConfig = {
  startExpanded: true,
  nodeConnector: 'solid',
  indentPx: 16,
  collapsePackages: true,
  showIcons: false,
  displayNodeDetails: false,
}

export const FileExplorer: React.FC<FileExplorerProps> = (props) => {
  return (
    <DiffViewerThemeProvider theme={props.config?.theme || Themes.light}>
      <FileExplorerProvider diff={props.diff} config={props.config || DEFAULT_CONFIG}>
        <FileExplorerContent
          css={props.css}
          className={props.className}
          onFileClick={props.onFileClick}
          onDirectoryToggle={props.onDirectoryToggle}
        />
      </FileExplorerProvider>
    </DiffViewerThemeProvider>
  )
}

const FileExplorerContent: React.FC<Omit<FileExplorerProps, 'diff' | 'config'>> = (props) => {
  const styles = useStyles()
  const { setSelectedNode, setExpandedDirs, tree } = useFileExplorerContext()

  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleExpandAll = () => {
    setExpandedDirs(listDirPaths(tree))
  }

  const handleCollapseAll = () => {
    setExpandedDirs(new Set<string>())
  }

  // Called when a directory is toggled (expand/collapse) deeper in the tree.
  // The FSNode component already updates the `expandedDirs` state, so we only
  // need to bubble the event up to any external consumer.
  const handleDirectoryToggle = (path: string, expanded: boolean) => {
    props.onDirectoryToggle?.(path, expanded)
  }

  const handleFileClick = (file: any) => {
    const filePath = file.newPath || file.oldPath
    setSelectedNode(filePath)
    props.onFileClick?.(file)
  }

  const handleDirectoryClick = (path: string, expanded: boolean) => {
    setSelectedNode(path)
    handleDirectoryToggle(path, expanded)
  }

  return (
    <div css={[styles.container, props.css]} className={props.className}>
      <ExplorerBar onExpandAll={handleExpandAll} onCollapseAll={handleCollapseAll} />

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
              onDirectoryToggle={handleDirectoryClick}
            />
          ))}
      </div>
    </div>
  )
}
