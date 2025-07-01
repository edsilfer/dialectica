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

/** Design Decision: Centralized constants for maintainability and consistency */
const CONSTANTS = {
  DRAWER_CLOSED_WIDTH: '2.25rem',
  TRANSITION_DURATION: '0.3s',
  HANDLE_SIZE: 14,
  TOOLBAR_MIN_HEIGHT: '2rem',
  SKELETON_ROWS: {
    TOOLBAR: 2,
    EXPLORER: 3,
    CODE_PANEL: 4,
  },
} as const

/** Design Decision: Consolidated loading state management for cleaner state handling */
interface LoadingStates {
  metadata: boolean
  diff: boolean
  explorerReady: boolean
  panelReady: boolean
}

interface DerivedLoadingStates {
  toolbar: boolean
  explorer: boolean
  codePanel: boolean
}

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
    gap: ${theme.spacing.md};
  `,

  drawerContainer: (explorerWidth: number, drawerOpen: boolean, dragging: boolean) => css`
    width: ${drawerOpen ? `calc(${explorerWidth}% - ${theme.spacing.sm} / 2)` : CONSTANTS.DRAWER_CLOSED_WIDTH};
    /** Design Decision: Disable transition during drag for smooth UX */
    transition: ${dragging ? 'none' : `width ${CONSTANTS.TRANSITION_DURATION} ease-in-out`};
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

  toolbarSkeleton: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    min-height: ${CONSTANTS.TOOLBAR_MIN_HEIGHT};
    padding: ${theme.spacing.xs};
    background-color: ${theme.colors.backgroundPrimary};
    border-top: 1px solid ${theme.colors.border};
    width: 100%;
  `,
})

/**
 * Design Decision: React 18 transition-based deferred rendering for performance.
 * Heavy components are rendered after user interactions complete, keeping UI responsive.
 */
const useDeferredReady = (isLoading: boolean): boolean => {
  const [ready, setReady] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (isLoading) {
      setReady(false)
      return
    }

    if (!ready) {
      startTransition(() => setReady(true))
    }
  }, [isLoading, ready])

  return ready
}

/** Reusable skeleton components to reduce duplication */
const SkeletonComponents = {
  Toolbar: ({ styles }: { styles: ReturnType<typeof getStyles> }) => (
    <div css={styles.toolbarSkeleton}>
      <Skeleton active title={false} paragraph={{ rows: CONSTANTS.SKELETON_ROWS.TOOLBAR, width: '60%' }} />
    </div>
  ),

  Explorer: () => (
    <Skeleton active title={false} paragraph={{ rows: CONSTANTS.SKELETON_ROWS.EXPLORER }} style={{ height: '100%' }} />
  ),

  CodePanel: ({ styles }: { styles: ReturnType<typeof getStyles> }) => (
    <div css={styles.diffViewer}>
      <Skeleton active paragraph={{ rows: CONSTANTS.SKELETON_ROWS.CODE_PANEL }} style={{ height: '100%' }} />
    </div>
  ),
}

/** Centralized loading state derivation */
const useDerivedLoadingStates = (loading: LoadingStates): DerivedLoadingStates =>
  useMemo(
    () => ({
      toolbar: loading.metadata,
      explorer: loading.metadata || !loading.explorerReady,
      codePanel: loading.diff || !loading.panelReady,
    }),
    [loading],
  )

/**
 * Design Decision: Provider pattern with automatic wrapping for flexible usage.
 * Component can be used with or without external provider context.
 */
export const DiffViewer: React.FC<DiffViewerProps> = (props) => {
  let hasProvider = true
  try {
    void useDiffViewerConfig()
  } catch {
    hasProvider = false
  }

  const viewer = <DiffViewerContent {...props} />

  return hasProvider ? (
    viewer
  ) : (
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
  const { theme, fileExplorerConfig, codePanelConfig } = useDiffViewerConfig()
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [scrollToFile, setScrollToFile] = useState<string | null>(null)
  const { width: explorerWidth, containerRef, onMouseDown, dragging } = useResizablePanel()

  /** Consolidated loading state management */
  const loadingStates: LoadingStates = {
    metadata: !!isMetadataLoading,
    diff: !!isDiffLoading,
    explorerReady: useDeferredReady(!!isMetadataLoading),
    panelReady: useDeferredReady(!!isDiffLoading),
  }

  const derivedLoading = useDerivedLoadingStates(loadingStates)
  const styles = useMemo(() => getStyles(theme), [theme])

  const handleFileClick = useCallback((file: { newPath: string; oldPath: string }) => {
    setScrollToFile(file.newPath ?? file.oldPath)
  }, [])

  const fileExplorer = useMemo(() => {
    if (derivedLoading.explorer) {
      return <SkeletonComponents.Explorer />
    }
    return (
      <FileExplorer
        key={JSON.stringify(fileExplorerConfig)}
        diff={diff}
        onFileClick={handleFileClick}
        css={styles.fileExplorer}
      />
    )
  }, [derivedLoading.explorer, diff, handleFileClick, styles.fileExplorer, fileExplorerConfig])

  const codePanelElement = useMemo(() => {
    if (derivedLoading.codePanel) {
      return <SkeletonComponents.CodePanel styles={styles} />
    }
    return (
      <CodePanel key={JSON.stringify(codePanelConfig)} diff={diff} scrollTo={scrollToFile} css={styles.diffViewer} />
    )
  }, [derivedLoading.codePanel, diff, scrollToFile, styles, codePanelConfig])

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

  const showResizeHandle = !derivedLoading.explorer && !derivedLoading.codePanel && drawerOpen

  return (
    <div css={styles.container}>
      {derivedLoading.toolbar ? (
        <SkeletonComponents.Toolbar styles={styles} />
      ) : (
        <Toolbar totalFiles={diff.files.length} title={title} subtitle={subtitle} />
      )}

      <div css={styles.content} ref={containerRef}>
        <div css={styles.drawerContainer(explorerWidth, drawerOpen, dragging)}>
          {derivedLoading.explorer ? (
            <SkeletonComponents.Explorer />
          ) : (
            <Drawer
              contents={drawerContents}
              state={drawerOpen ? 'open' : 'closed'}
              default="file-explorer"
              onStateChange={(state) => setDrawerOpen(state === 'open')}
            />
          )}
        </div>

        {showResizeHandle && (
          <div css={styles.resizerWrapper(explorerWidth)} onMouseDown={onMouseDown}>
            <HandleIcon size={CONSTANTS.HANDLE_SIZE} />
          </div>
        )}

        {codePanelElement}
      </div>
    </div>
  )
}
