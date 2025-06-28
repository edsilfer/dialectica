import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../shared/providers/theme-provider'
import { Themes } from '../shared/themes'
import DirNode from './components/DirNode'
import FileNode from './components/FileNode'
import { FileExplorerConfig, FileExplorerProps } from './types'
import { sortNodes } from './utils'
import { DiffViewerThemeProvider } from '../shared/providers/theme-provider'
import { FileExplorerProvider, useFileExplorerContext } from './provider/file-explorer-context'
import { ExplorerBar } from './components/ExplorerBar'

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
      <ExplorerBar />

      <div css={styles.fsTreeContainer}>
        {Array.from(tree.children.values())
          .sort(sortNodes)
          .map((node, idx, arr) => {
            const isLast = idx === arr.length - 1
            if (node.type === 'file') {
              return (
                <FileNode
                  key={node.name}
                  node={node}
                  level={0}
                  isLast={isLast}
                  parentPath=""
                  onFileClick={handleFileClick}
                />
              )
            }

            return (
              <DirNode
                key={node.name}
                node={node}
                level={0}
                isLast={isLast}
                parentPath=""
                onFileClick={handleFileClick}
                onDirectoryToggle={handleDirectoryClick}
              />
            )
          })}
      </div>
    </div>
  )
}
