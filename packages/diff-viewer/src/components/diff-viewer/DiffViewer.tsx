import { css } from '@emotion/react'
import React, { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { Toolbar as DefaultToolbar } from '../../addons/toolbar/DefaultToolbar'
import { Themes } from '../../themes'
import { CodePanel } from '../code-panel/FileList'
import { FileExplorer } from '../file-explorer/FileExplorer'
import DirectoryIcon from '../ui/icons/Directory'
import HandleIcon from '../ui/icons/HandleIcon'
import { Drawer } from './components/Drawer'
import { useResizablePanel } from './hooks/use-resizable-panel'
import { DiffViewerConfigProvider, useDiffViewerConfig } from './providers/diff-viewer-context'
import { DiffViewerProps } from './types'

const DRAWER_CLOSED_WIDTH = '2.25rem'
const TRANSITION_DURATION = '0.3s'
const HANDLE_SIZE = 14

const getStyles = (theme: ReturnType<typeof useDiffViewerConfig>['theme']) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.xs};
    height: 100%;
    width: 100%;
  `,

  content: css`
    position: relative;
    display: flex;
    flex: 1;
    width: 100%;
    overflow: hidden;
    gap: ${theme.spacing.sm};
  `,

  // Optimized: Use CSS custom properties for dynamic values to avoid style recalculation
  drawerContainer: css`
    width: var(--drawer-width);
    transition: var(--drawer-transition);
    overflow: hidden;
  `,

  fileExplorer: css`
    height: 100%;
    overflow: auto;
  `,

  // Optimized: Use CSS custom properties for dynamic positioning
  resizerWrapper: css`
    position: absolute;
    top: 50%;
    left: var(--resizer-left);
    transform: translate(-50%, -50%);
    width: ${theme.spacing.lg};
    height: ${theme.spacing.lg};
    border: 1px solid ${theme.colors.border};
    border-radius: 50%;
    background-color: ${theme.colors.backgroundContainer};
    color: ${theme.colors.accent};
    z-index: 1;
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
})

/**
 * - Design Decision: React 18 transition-based deferred rendering for performance.
 * - Heavy components are rendered after user interactions complete, keeping UI responsive.
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
    <DiffViewerConfigProvider theme={Themes.light} storage="in-memory">
      {viewer}
    </DiffViewerConfigProvider>
  )
}

const DiffViewerContent: React.FC<DiffViewerProps> = (props) => {
  const { theme } = useDiffViewerConfig()
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [scrollToFile, setScrollToFile] = useState<string | undefined>(undefined)
  const { width: explorerWidth, containerRef, onMouseDown, dragging } = useResizablePanel()

  const explorerReady = useDeferredReady(!!(props.isMetadataLoading ?? false))
  const panelReady = useDeferredReady(!!(props.isDiffLoading ?? false))
  const styles = useMemo(() => getStyles(theme), [theme])
  const showResizeHandle = explorerReady && panelReady && drawerOpen

  // Optimized: Memoize dynamic CSS custom properties
  const dynamicStyles = useMemo(
    () => ({
      '--drawer-width': drawerOpen ? `calc(${explorerWidth}% - ${theme.spacing.sm} / 2)` : DRAWER_CLOSED_WIDTH,
      '--drawer-transition': dragging ? 'none' : `width ${TRANSITION_DURATION} ease-in-out`,
      '--resizer-left': `calc(${explorerWidth}% + ${theme.spacing.sm} / 2)`,
    }),
    [explorerWidth, drawerOpen, dragging, theme.spacing.sm],
  )

  const handleFileClick = useCallback((file: { newPath: string; oldPath: string }) => {
    setScrollToFile(file.newPath ?? file.oldPath)
  }, [])

  const drawerContents = useMemo(() => {
    const builtInContents = [
      {
        key: 'file-explorer',
        title: 'File explorer',
        icon: <DirectoryIcon />,
        description: 'Browse changed files',
        content: <FileExplorer diff={props.diff} onFileClick={handleFileClick} css={styles.fileExplorer} />,
      },
    ]

    return [...builtInContents, ...(props.additionalDrawerContents ?? [])]
  }, [props.diff, props.additionalDrawerContents, handleFileClick, styles.fileExplorer])

  const codePanel = useMemo(
    () => (
      <CodePanel
        files={props.diff.files}
        scrollTo={scrollToFile}
        isLoading={!!(props.isDiffLoading ?? false) || !panelReady}
        css={styles.diffViewer}
        onLoadMoreLines={props.onLoadMoreLines}
        maxLinesToFetch={props.maxLinesToFetch}
        overlays={props.overlays}
        widgets={props.widgets}
      />
    ),
    [
      props.diff.files,
      scrollToFile,
      props.isDiffLoading,
      panelReady,
      styles.diffViewer,
      props.onLoadMoreLines,
      props.maxLinesToFetch,
      props.overlays,
      props.widgets,
    ],
  )

  return (
    <div css={styles.container}>
      {props.toolbar ? props.toolbar : <DefaultToolbar loading={!!(props.isMetadataLoading ?? false)} />}

      <div css={styles.content} ref={containerRef} style={dynamicStyles as React.CSSProperties}>
        {(props.enableFileExplorer ?? true) && (
          <div css={styles.drawerContainer}>
            <Drawer
              contents={drawerContents}
              state={drawerOpen ? 'open' : 'closed'}
              default="file-explorer"
              loading={!!(props.isMetadataLoading ?? false) || !explorerReady}
              onStateChange={(state) => setDrawerOpen(state === 'open')}
            />
          </div>
        )}

        {(props.enableFileExplorer ?? true) && showResizeHandle && (
          <div css={styles.resizerWrapper} onMouseDown={onMouseDown}>
            <HandleIcon size={HANDLE_SIZE} />
          </div>
        )}

        {codePanel}
      </div>
    </div>
  )
}
