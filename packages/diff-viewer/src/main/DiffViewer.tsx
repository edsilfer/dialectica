import { css } from '@emotion/react'
import React, { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { CodePanel } from '../code-panel/FileList'
import { FileExplorer } from '../file-explorer/FileExplorer'
import DirectoryIcon from '../shared/icons/Directory'
import HandleIcon from '../shared/icons/HandleIcon'
import { Themes } from '../shared/themes'
import { Toolbar as DefaultToolbar } from '../utilities/toolbar/DefaultToolbar'
import { Drawer } from './components/drawer/Drawer'
import { useResizablePanel } from './hook/use-resizable-panel'
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

  drawerContainer: (explorerWidth: number, drawerOpen: boolean, dragging: boolean) => css`
    width: ${drawerOpen ? `calc(${explorerWidth}% - ${theme.spacing.sm} / 2)` : DRAWER_CLOSED_WIDTH};
    /** Design Decision: Disable transition during drag for smooth UX */
    transition: ${dragging ? 'none' : `width ${TRANSITION_DURATION} ease-in-out`};
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
  const { theme, fileExplorerConfig, codePanelConfig } = useDiffViewerConfig()
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [scrollToFile, setScrollToFile] = useState<string | undefined>(undefined)
  const { width: explorerWidth, containerRef, onMouseDown, dragging } = useResizablePanel()

  const explorerReady = useDeferredReady(!!(props.isMetadataLoading ?? false))
  const panelReady = useDeferredReady(!!(props.isDiffLoading ?? false))
  const styles = useMemo(() => getStyles(theme), [theme])
  const showResizeHandle = explorerReady && panelReady && drawerOpen

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
        content: (
          <FileExplorer
            key={JSON.stringify(fileExplorerConfig)}
            diff={props.diff}
            onFileClick={handleFileClick}
            css={styles.fileExplorer}
          />
        ),
      },
    ]

    return [...builtInContents, ...(props.additionalDrawerContents ?? [])]
  }, [fileExplorerConfig, props.diff, props.additionalDrawerContents, handleFileClick, styles.fileExplorer])

  return (
    <div css={styles.container}>
      {props.toolbar ? props.toolbar : <DefaultToolbar loading={!!(props.isMetadataLoading ?? false)} />}

      <div css={styles.content} ref={containerRef}>
        {(props.enableFileExplorer ?? true) && (
          <div css={styles.drawerContainer(explorerWidth, drawerOpen, dragging)}>
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
          <div css={styles.resizerWrapper(explorerWidth)} onMouseDown={onMouseDown}>
            <HandleIcon size={HANDLE_SIZE} />
          </div>
        )}

        <CodePanel
          key={JSON.stringify(codePanelConfig)}
          files={props.diff.files}
          scrollTo={scrollToFile}
          isLoading={!!(props.isDiffLoading ?? false) || !panelReady}
          css={styles.diffViewer}
          onLoadMoreLines={props.onLoadMoreLines}
          maxLinesToFetch={props.maxLinesToFetch}
        />
      </div>
    </div>
  )
}
