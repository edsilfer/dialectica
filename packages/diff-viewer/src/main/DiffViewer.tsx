import { css } from '@emotion/react'
import React, { useCallback, useMemo, useState } from 'react'
import { CodePanel } from '../code-panel/CodePanel'
import { FileExplorer } from '../file-explorer/FileExplorer'
import HandleIcon from '../shared/icons/HandleIcon'
import { DiffViewerConfigProvider, useDiffViewerConfig } from '../shared/providers/diff-viewer-context'
import { Themes } from '../shared/themes'
import { useResizablePanel } from './hook/use-resizable-panel'
import { DiffViewerProps } from './types'

const createStyles = (theme: ReturnType<typeof useDiffViewerConfig>['theme']) => ({
  container: css`
    display: flex;
    height: 100%;
    width: 100%;
    overflow: hidden;
  `,
  fileExplorer: css`
    height: 100%;
    overflow: auto;
  `,
  resizer: css`
    display: flex;
    align-items: center;
    color: ${theme.colors.border};
    padding: ${theme.spacing.xs};
    justify-content: center;
    height: 100%;
    cursor: col-resize;
  `,
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

  // Styles are memoised so Emotion doesn't regenerate classes during drags.
  const styles = useMemo(() => createStyles(theme), [theme])

  const [scrollToFile, setScrollToFile] = useState<string | null>(null)
  const { width: explorerWidth, containerRef, onMouseDown } = useResizablePanel()

  // Stable callback so FileExplorer receives an unchanged prop between drags
  const handleFileClick = useCallback((file: { newPath: string; oldPath: string }) => {
    setScrollToFile(file.newPath ?? file.oldPath)
  }, [])

  // Memoised heavy children to prevent rerenders on width changes
  const fileExplorerElement = useMemo(
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
    <div css={styles.container} ref={containerRef}>
      {/* File explorer panel */}
      <div
        css={css`
          width: ${explorerWidth}%;
        `}
      >
        {fileExplorerElement}
      </div>

      {/* Drag handle */}
      <div css={styles.resizer} onMouseDown={onMouseDown}>
        <HandleIcon size={18} />
      </div>

      {/* Diff viewer */}
      {codePanelElement}
    </div>
  )
}
