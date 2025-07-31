import { DirectoryIcon, HandleIcon, Themes, useIsMobile } from '@commons'
import { css } from '@emotion/react'
import { FileExplorer, FileMetadata } from '@file-explorer'
import React, { useContext, useEffect, useMemo, useState, useTransition } from 'react'
import { Drawer, DrawerContent } from './components/drawer/Drawer'
import { FileList } from './components/file-list/FileList'
import { useResizablePanel } from './hooks/use-resizable-panel'
import { LineRange, LoadMoreLinesHandler, Overlay, Widget } from './models/LineExtensions'
import { ParsedDiff } from './models/ParsedDiff'
import { DiffViewerConfigContext, DiffViewerConfigProvider, useDiffViewerConfig } from './providers/diff-viewer-context'

const DRAWER_CLOSED_WIDTH = '2.25rem'
const TRANSITION_DURATION = '0.3s'
const HANDLE_SIZE = 14
const EXPLORER_INITIAL_WIDTH = 28
const EXPLORER_MIN_WIDTH = 10
const EXPLORER_MAX_WIDTH = 50

function useStyles(theme: ReturnType<typeof useDiffViewerConfig>['theme']) {
  return useMemo(
    () => ({
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
        gap: ${theme.spacing.sm};
      `,
      drawerContainer: css`
        width: var(--drawer-width);
        transition: var(--drawer-transition);
        overflow: hidden;
      `,
      fileExplorer: css`
        height: 100%;
        overflow: auto;
      `,
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
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
        svg {
          pointer-events: none;
        }
      `,
      diffViewer: css`
        flex: 1;
        border-radius: ${theme.spacing.xs};
      `,
    }),
    [theme],
  )
}

export interface DiffViewerProps {
  /** The diff to display. */
  diff: ParsedDiff
  /** Whether the metadata is loading. */
  isMetadataLoading?: boolean
  /** Whether the diff is loading. */
  isDiffLoading?: boolean
  /** Whether to enable the file explorer. */
  enableFileExplorer?: boolean
  /** Additional contents to display in the drawer. */
  additionalDrawerContents?: DrawerContent[]
  /** Toolbar to display above the diff viewer. */
  toolbar?: React.ReactNode
  /** Overlays to display on the diff viewer. */
  overlays?: Overlay[]
  /** Widgets to display on the diff viewer. */
  widgets?: Widget[]
  /** Lines to highlight in the diff viewer. */
  highlightedLines?: LineRange
  /** Callback to load more lines. */
  onLoadMoreLines?: LoadMoreLinesHandler
  /** Callback to select a line range. */
  onLineSelection?: (lineRange: LineRange) => void
}

export const DiffViewer: React.FC<DiffViewerProps> = (props) => {
  const withinProvider = useHasDiffViewerProvider()

  if (!withinProvider) {
    return (
      <DiffViewerConfigProvider theme={Themes.light} storage="in-memory">
        <InternalDiffViewer {...props} />
      </DiffViewerConfigProvider>
    )
  }

  return <InternalDiffViewer {...props} />
}

const InternalDiffViewer: React.FC<DiffViewerProps> = (props) => {
  const { theme } = useDiffViewerConfig()

  const enableExplorer = props.enableFileExplorer ?? true
  const [scrollToFile, setScrollToFile] = useState<string>()
  const explorerReady = useDeferredReady(props.isMetadataLoading)
  const panelReady = useDeferredReady(props.isDiffLoading)
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(() => enableExplorer && !isMobile)

  const showFileList = !(isMobile && drawerOpen)
  const showHandle = enableExplorer && !isMobile && drawerOpen && explorerReady && panelReady

  const {
    width: explorerWidth,
    containerRef,
    dragging,
    onMouseDown,
    setWidth,
  } = useResizablePanel({
    initial: isMobile ? 100 : EXPLORER_INITIAL_WIDTH,
    min: isMobile ? 100 : EXPLORER_MIN_WIDTH,
    max: isMobile ? 100 : EXPLORER_MAX_WIDTH,
  })

  const explorerWidthPct = drawerOpen ? explorerWidth : EXPLORER_INITIAL_WIDTH
  const styles = useStyles(theme)

  useEffect(() => {
    if (!enableExplorer) return
    setDrawerOpen(!isMobile)
    setWidth(isMobile ? 100 : EXPLORER_INITIAL_WIDTH)
  }, [isMobile, enableExplorer, setWidth])

  const dynamicStyles = useMemo(
    () => computeStyles(drawerOpen, explorerWidthPct, dragging, theme.spacing.sm),
    [drawerOpen, explorerWidthPct, dragging, theme.spacing.sm],
  )

  const files = useMemo(() => toFileMetadata(props.diff.files), [props.diff.files])

  const drawerContents = useMemo(
    () =>
      buildDrawerContents(files, props.additionalDrawerContents, styles, (file) =>
        setScrollToFile(file.newPath ?? file.oldPath),
      ),
    [files, props.additionalDrawerContents, styles],
  )

  const fileList = useMemo(
    () => (
      <FileList
        files={props.diff.files}
        scrollTo={scrollToFile}
        isLoading={!panelReady}
        css={styles.diffViewer}
        onLoadMoreLines={props.onLoadMoreLines}
        onRangeSelected={props.onLineSelection}
        overlays={props.overlays}
        widgets={props.widgets}
        highlightedLines={props.highlightedLines}
      />
    ),
    [
      scrollToFile,
      panelReady,
      styles.diffViewer,
      props.diff.files,
      props.onLoadMoreLines,
      props.onLineSelection,
      props.overlays,
      props.widgets,
      props.highlightedLines,
    ],
  )

  return (
    <div css={styles.container}>
      {props.toolbar}
      <div css={styles.content} ref={containerRef} style={dynamicStyles as React.CSSProperties}>
        {enableExplorer && (
          <div css={styles.drawerContainer}>
            <Drawer
              contents={drawerContents}
              state={drawerOpen ? 'open' : 'closed'}
              default="file-explorer"
              loading={!explorerReady}
              onStateChange={(state) => setDrawerOpen(state === 'open')}
            />
          </div>
        )}

        {showHandle && (
          <div css={styles.resizerWrapper} onMouseDown={onMouseDown}>
            <HandleIcon size={HANDLE_SIZE} />
          </div>
        )}

        {showFileList && fileList}
      </div>
    </div>
  )
}

/**
 * Marks the UI ready *after* the heavy async work finishes, using startTransition to avoid blocking user input.
 *
 * @param loading - Whether the UI is loading.
 * @returns       - Whether the UI is ready.
 */
const useDeferredReady = (loading = false): boolean => {
  const [ready, setReady] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (loading) {
      setReady(false)
      return
    }
    if (!ready) {
      startTransition(() => setReady(true))
    }
  }, [loading, ready])

  return ready
}

function useHasDiffViewerProvider(): boolean {
  try {
    const context = useContext(DiffViewerConfigContext)
    return context !== undefined
  } catch {
    return false
  }
}

function toFileMetadata(files: ParsedDiff['files']): FileMetadata[] {
  return files.map(
    (f) =>
      new FileMetadata({
        oldPath: f.oldPath,
        newPath: f.newPath,
        isRenamed: f.isRenamed,
        isNew: f.isNew,
        isDeleted: f.isDeleted,
        language: f.language,
        isBinary: f.isBinary,
      }),
  )
}

function buildDrawerContents(
  files: FileMetadata[],
  extra: DrawerContent[] | undefined,
  styles: ReturnType<typeof useStyles>,
  onClick: (file: FileMetadata) => void,
): DrawerContent[] {
  const base = [
    {
      key: 'file-explorer',
      title: 'File explorer',
      icon: <DirectoryIcon />,
      description: 'Browse changed files',
      content: <FileExplorer files={files} onFileClick={onClick} css={styles.fileExplorer} />,
    },
  ]
  return [...base, ...(extra ?? [])]
}

/**
 * Computes the dynamic styles for the diff viewer.
 *
 * @param drawerOpen       - Whether the drawer is open.
 * @param explorerWidthPct - The width of the explorer in %.
 * @param dragging         - Whether the user is dragging the resizer.
 * @param spacingSm        - The spacing between the explorer and the diff viewer.
 * @returns                - The dynamic styles.
 */
function computeStyles(drawerOpen: boolean, explorerWidthPct: number, dragging: boolean, spacingSm: string) {
  return {
    '--drawer-width': drawerOpen ? `calc(${explorerWidthPct}% - ${spacingSm} / 2)` : DRAWER_CLOSED_WIDTH,
    '--drawer-transition': dragging ? 'none' : `width ${TRANSITION_DURATION} ease-in-out`,
    '--resizer-left': `calc(${explorerWidthPct}% + ${spacingSm} / 2)`,
  } as const
}
