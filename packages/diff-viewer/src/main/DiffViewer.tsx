import { css } from '@emotion/react'
import React, { useCallback, useMemo, useState } from 'react'
import { CodePanel } from '../code-panel/CodePanel'
import { FileExplorer } from '../file-explorer/FileExplorer'
import HandleIcon from '../shared/icons/HandleIcon'
import { DiffViewerConfigProvider, useDiffViewerConfig } from './providers/diff-viewer-context'
import { Themes } from '../shared/themes'
import { useResizablePanel } from './hook/use-resizable-panel'
import { DiffViewerProps } from './types'
import { Toolbar } from './components/Toolbar'

const createStyles = (theme: ReturnType<typeof useDiffViewerConfig>['theme']) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.sm};
    height: 100%;
    width: 100%;
  `,
  toolbar: css``,
  content: css`
    position: relative;
    display: flex;
    flex: 1;
    width: 100%;
    overflow: hidden;
    gap: ${theme.spacing.sm};
  `,
  fileExplorerContainer: (explorerWidth: number, drawerOpen: boolean, dragging: boolean) => css`
    /* Slide-in/out by animating width */
    width: ${drawerOpen ? `calc(${explorerWidth}% - ${theme.spacing.sm} / 2)` : '0%'};
    /* Disable the transition while the user is actively dragging to keep the panel in sync */
    transition: ${dragging ? 'none' : 'width 0.3s ease-in-out'};
    overflow: hidden;
  `,
  fileExplorer: css`
    height: 100%;
    overflow: auto;
  `,
  resizerWrapper: (explorerWidth: number) => css`
    position: absolute;
    top: 50%;
    left: calc(${explorerWidth}% + ${theme.spacing.sm} / 2);
    transform: translate(-50%, -50%);
    width: ${theme.spacing.lg};
    height: ${theme.spacing.lg};
    border: 1px solid ${theme.colors.border};
    border-radius: 50%;
    background-color: ${theme.colors.backgroundContainer};
    color: ${theme.colors.accent};
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
  `,
  handleIcon: css``,
  diffViewer: css`
    flex: 1;
    border-radius: ${theme.spacing.xs};
    overflow: auto;
  `,
})

/**
 * High-level component that bundles together the FileExplorer and CodePanel into a single, ready-to-use diff viewer.
 */
export const DiffViewer: React.FC<DiffViewerProps> = (props) => {
  let hasProvider = true
  try {
    void useDiffViewerConfig()
  } catch {
    hasProvider = false
  }

  const viewer = <DiffViewerContent {...props} />

  if (hasProvider) {
    return viewer
  }

  return (
    <DiffViewerConfigProvider
      theme={props.theme ?? Themes.light}
      codePanelConfig={props.codePanelConfig}
      fileExplorerConfig={props.fileExplorerConfig}
      storage={props.storage}
    >
      {viewer}
    </DiffViewerConfigProvider>
  )
}

const DiffViewerContent: React.FC<DiffViewerProps> = ({ diff }) => {
  const { theme, fileExplorerConfig, codePanelConfig } = useDiffViewerConfig()

  const [drawerOpen, setDrawerOpen] = useState(true)
  // Styles are memoised so Emotion doesn't regenerate classes during drags.
  const styles = useMemo(() => createStyles(theme), [theme])
  const [scrollToFile, setScrollToFile] = useState<string | null>(null)
  const { width: explorerWidth, containerRef, onMouseDown, dragging } = useResizablePanel()

  // Stable callback so FileExplorer receives an unchanged prop between drags
  const handleFileClick = useCallback((file: { newPath: string; oldPath: string }) => {
    setScrollToFile(file.newPath ?? file.oldPath)
  }, [])

  // Memoised heavy children to prevent rerenders on width changes
  const fileExplorer = useMemo(
    () => (
      <FileExplorer
        key={JSON.stringify(fileExplorerConfig)}
        diff={diff}
        onFileClick={handleFileClick}
        css={styles.fileExplorer}
      />
    ),
    [diff, handleFileClick, styles.fileExplorer, fileExplorerConfig],
  )

  const codePanelElement = useMemo(
    () => (
      <CodePanel key={JSON.stringify(codePanelConfig)} diff={diff} scrollTo={scrollToFile} css={styles.diffViewer} />
    ),
    [diff, scrollToFile, styles.diffViewer, codePanelConfig],
  )

  return (
    <div css={styles.container}>
      <Toolbar totalFiles={diff.files.length} drawerOpen={drawerOpen} onToggleDrawer={setDrawerOpen} />
      <div css={styles.content} ref={containerRef}>
        {/* File explorer panel */}
        <div css={styles.fileExplorerContainer(explorerWidth, drawerOpen, dragging)}>{fileExplorer}</div>

        {/* Drag handle */}
        {drawerOpen && (
          <div css={[styles.resizerWrapper(explorerWidth)]} onMouseDown={onMouseDown}>
            <HandleIcon size={14} />
          </div>
        )}

        {/* Diff viewer */}
        {codePanelElement}
      </div>
    </div>
  )
}
