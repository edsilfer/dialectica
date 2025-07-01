import { css } from '@emotion/react'
import { Skeleton } from 'antd'
import React, { useCallback, useMemo, useState, useTransition, useEffect } from 'react'
import { CodePanel } from '../code-panel/CodePanel'
import { FileExplorer } from '../file-explorer/FileExplorer'
import HandleIcon from '../shared/icons/HandleIcon'
import { Themes } from '../shared/themes'
import { Toolbar } from './components/Toolbar'
import { useResizablePanel } from './hook/use-resizable-panel'
import { DiffViewerConfigProvider, useDiffViewerConfig } from './providers/diff-viewer-context'
import { DiffViewerProps } from './types'
import { Drawer } from './components/Drawer'
import DirectoryIcon from '../shared/icons/Directory'
import type { DrawerContent } from './components/types'

const getStyles = (theme: ReturnType<typeof useDiffViewerConfig>['theme']) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.sm};
    height: 100%;
    width: 100%;
  `,

  content: css`
    position: relative;
    display: flex;
    flex: 1;
    width: 100%;
    overflow: hidden;
    /* Consistent spacing between panels */
    gap: ${theme.spacing.md};
  `,

  drawerContainer: (explorerWidth: number, drawerOpen: boolean, dragging: boolean) => css`
    /* Slide-in/out by animating width. When closed we still reserve icon rail width */
    width: ${drawerOpen ? `calc(${explorerWidth}% - ${theme.spacing.sm} / 2)` : '2.25rem'};
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

  diffViewer: css`
    flex: 1;
    border-radius: ${theme.spacing.xs};
    overflow: auto;
  `,

  loadingWrapper: css`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  `,

  /* Placeholder skeleton that mimics the Toolbar look & feel */
  toolbarSkeleton: css`
    /* Match Toolbar container layout so the height stays consistent before/after load */
    display: flex;
    flex-direction: row;
    align-items: center;
    min-height: 2rem; /* Same reserved space as real Toolbar */
    padding: ${theme.spacing.xs};
    background-color: ${theme.colors.backgroundPrimary};
    border-top: 1px solid ${theme.colors.border};
    width: 100%;
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

const DiffViewerContent: React.FC<DiffViewerProps> = ({
  diff,
  title,
  subtitle,
  isMetadataLoading = false,
  isDiffLoading = false,
}) => {
  // Normalize loading flags (undefined -> false)
  const metadataLoading = !!isMetadataLoading
  const diffLoading = !!isDiffLoading

  const { theme, fileExplorerConfig, codePanelConfig } = useDiffViewerConfig()

  const [drawerOpen, setDrawerOpen] = useState(true)
  // Styles are memoised so Emotion doesn't regenerate classes during drags.
  const styles = useMemo(() => getStyles(theme), [theme])

  const [scrollToFile, setScrollToFile] = useState<string | null>(null)
  const { width: explorerWidth, containerRef, onMouseDown, dragging } = useResizablePanel()

  // Stable callback so FileExplorer receives an unchanged prop between drags (only used when not loading)
  const handleFileClick = useCallback((file: { newPath: string; oldPath: string }) => {
    setScrollToFile(file.newPath ?? file.oldPath)
  }, [])

  /* ------------------------------------------------------------------
   * Staged readiness flags so parts of the UI appear progressively:
   *   1. Toolbar → once metadata is fetched (lightweight).
   *   2. File-Explorer → heavy tree building is deferred in a transition.
   *   3. Code-Panel → even heavier rendering also deferred in a transition.
   *
   * What is a "transition"?
   * -----------------------
   * In React 18, calling `startTransition` marks the enclosed state updates as
   * "non-urgent".  React will keep displaying the current UI and schedule the
   * updated UI at a lower priority.  While the work is *pending* (`isPending`
   * flag), user-input and high-priority updates are not blocked, and we can keep
   * showing lightweight placeholders (our skeletons).  When the background work
   * finishes, React swaps in the new UI in a single paint, giving us a smooth
   * progressive loading experience without jank.
   * ------------------------------------------------------------------ */

  // File-Explorer readiness
  const [explorerReady, setExplorerReady] = useState(false)
  const [isExplorerPending, startExplorerTransition] = useTransition()

  useEffect(() => {
    if (metadataLoading) {
      setExplorerReady(false)
      return
    }

    if (!explorerReady) {
      startExplorerTransition(() => {
        setExplorerReady(true)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadataLoading])

  // Code-Panel readiness
  const [panelReady, setPanelReady] = useState(false)
  const [isPanelPending, startPanelTransition] = useTransition()

  useEffect(() => {
    if (diffLoading) {
      setPanelReady(false)
      return
    }

    if (!panelReady) {
      startPanelTransition(() => {
        setPanelReady(true)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diffLoading])

  // Derived loading states per section
  const toolbarLoading = metadataLoading
  const explorerLoading = metadataLoading || !explorerReady
  const codePanelLoading = diffLoading || !panelReady

  // Render the FileExplorer or its skeleton depending on loading states.
  const fileExplorer = useMemo(() => {
    if (explorerLoading) {
      return <Skeleton active title={false} paragraph={{ rows: 3 }} style={{ height: '100%' }} />
    }
    return (
      <FileExplorer
        key={JSON.stringify(fileExplorerConfig)}
        diff={diff}
        onFileClick={handleFileClick}
        css={styles.fileExplorer}
      />
    )
  }, [explorerLoading, diff, handleFileClick, styles.fileExplorer, fileExplorerConfig])

  // Render the CodePanel or its skeleton depending on diff loading state.
  const codePanelElement = useMemo(() => {
    if (codePanelLoading) {
      return (
        <div css={styles.diffViewer}>
          <Skeleton active paragraph={{ rows: 4 }} style={{ height: '100%' }} />
        </div>
      )
    }
    return (
      <CodePanel key={JSON.stringify(codePanelConfig)} diff={diff} scrollTo={scrollToFile} css={styles.diffViewer} />
    )
  }, [codePanelLoading, diff, scrollToFile, styles.diffViewer, codePanelConfig])

  const drawerContents: DrawerContent[] = useMemo(
    () => [
      {
        key: 'file-explorer',
        title: 'File explorer',
        icon: <DirectoryIcon />,
        description: 'Browse changed files',
        content: fileExplorer,
      },
    ],
    [fileExplorer],
  )

  return (
    <div css={styles.container}>
      {toolbarLoading ? (
        <div css={styles.toolbarSkeleton}>
          <Skeleton active title={false} paragraph={{ rows: 2, width: '60%' }} />
        </div>
      ) : (
        <Toolbar totalFiles={diff.files.length} title={title} subtitle={subtitle} />
      )}

      <div css={styles.content} ref={containerRef}>
        {/* Drawer panel */}
        <div css={styles.drawerContainer(explorerWidth, drawerOpen, dragging)}>
          <Drawer
            contents={drawerContents}
            state={drawerOpen ? 'open' : 'closed'}
            default="file-explorer"
            onStateChange={(state) => setDrawerOpen(state === 'open')}
          />
        </div>

        {/* Drag handle */}
        {!explorerLoading && !codePanelLoading && drawerOpen && (
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
