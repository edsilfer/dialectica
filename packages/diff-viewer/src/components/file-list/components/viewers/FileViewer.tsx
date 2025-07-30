import { ThemeContext } from '@commons'
import { css } from '@emotion/react'
import { theme as antTheme, Spin, Typography } from 'antd'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useContextSelector } from 'use-context-selector'
import { FileDiff } from '../../../../models/FileDiff'
import { LineRange, LoadMoreLinesHandler, Overlay, Widget } from '../../../../models/LineExtensions'
import { FileListConfigContext, useFileState } from '../../../../providers/file-list-context'
import { useOverlayController } from '../../hooks/use-overlay-controller'
import { useRowController } from '../../hooks/use-row-controller'
import { useRowSelection } from '../../hooks/use-row-selection'
import { DiffRow } from '../rows/DiffRow'
import Header from './Header'
import { getViewerStyles } from './shared-styles'

const { Text } = Typography

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return useMemo(
    () => ({
      container: css`
        display: flex;
        flex-direction: column;
        border: 1px solid ${theme.colors.border};
        border-radius: ${theme.spacing.xs};
        overflow: hidden;
        flex: 0 0 auto;
      `,

      bodyExpanded: css`
        border: 1px solid ${theme.colors.border};
        border-top: none;
        border-bottom-left-radius: ${theme.spacing.xs};
        border-bottom-right-radius: ${theme.spacing.xs};
        overflow: hidden;
      `,

      bodyCollapsed: css`
        display: none;
      `,

      hunksContainer: css`
        display: flex;
        flex-direction: column;
      `,

      binaryMessageWrapper: css`
        padding: ${theme.spacing.xs};
      `,

      loadMoreContaier: css`
        display: flex;
        justify-content: center;
        gap: ${theme.spacing.md};
        align-items: center;
        padding: ${theme.spacing.md};
      `,
    }),
    [theme],
  )
}

interface FileViewerProps {
  /** A unique identifier for the file viewer. */
  id?: string
  /** The file diff object. */
  file: FileDiff
  /** Array of overlays to display on top of line columns when hovered. */
  overlays?: Overlay[]
  /** Array of widgets to display at specific line positions. */
  widgets?: Widget[]
  /** The line range to highlight. */
  highlightedLines?: LineRange
  /** Whether the file is initially collapsed. */
  startCollapsed?: boolean
  /** Override the mode from the provider. */
  overrideMode?: 'unified' | 'split'

  /** Called when the file is force rendered. */
  onForceRender?: (fileKey: string) => void
  /** Called when user requests to load (expand) more lines around a hunk. */
  onLoadMoreLines?: LoadMoreLinesHandler
  /** Called when user selects a line range. */
  onRangeSelected?: (range: LineRange) => void
}

const FileViewerComponent = (props: FileViewerProps) => {
  const {
    file,
    id,
    overlays,
    widgets,
    highlightedLines,
    overrideMode,
    onLoadMoreLines,
    onRangeSelected,
    onForceRender,
  } = props
  // Only really lazy‑render gigantic diffs.
  const lazyRender = props.startCollapsed ?? false
  const styles = useStyles()
  const theme = useContext(ThemeContext)
  const { token: antdThemeToken } = antTheme.useToken()
  const viewerStyles = useMemo(() => getViewerStyles(theme, antdThemeToken), [theme, antdThemeToken])
  const { ref: viewerRef, inView } = useInView(
    lazyRender
      ? { triggerOnce: true, rootMargin: '1000px' } // wait until the row scrolls near the viewport
      : { triggerOnce: true, rootMargin: '0px' }, // immediately “in view” for normal‑sized files
  )

  // small files render right away; huge files wait for the IO callback
  const [shouldRender, setShouldRender] = useState(!lazyRender)
  // shows spinner while the heavy <Diff> markup is being scheduled
  const [contentReady, setContentReady] = useState(
    // small files are ready immediately
    !lazyRender || !props.startCollapsed,
  )

  useEffect(() => {
    // nothing to do for rows that always render or that have already rendered
    if (!lazyRender || shouldRender) return
    if (inView) {
      const id =
        typeof window.requestIdleCallback === 'function'
          ? window.requestIdleCallback(() => setShouldRender(true))
          : window.setTimeout(() => setShouldRender(true), 30)

      return () => {
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(id)
        } else {
          clearTimeout(id)
        }
      }
    }
  }, [inView, lazyRender, shouldRender])

  const config = useContextSelector(FileListConfigContext, (ctx) => {
    if (!ctx) {
      throw new Error('FileViewer must be inside CodePanelConfigProvider')
    }
    return ctx.config
  })

  // Use overrideMode if provided, otherwise use the mode from config
  const effectiveMode = overrideMode ?? config.mode
  const containerRef = useRef<HTMLDivElement>(null)
  const fileWidgets = useMemo(() => (widgets ?? []).filter((w) => w.filepath === file.key), [widgets, file.key])

  // STATE ------------------------------------------------------------------------------------
  const { isCollapsed } = useFileState(file.key)

  // CONTROLLERS --------------------------------------------------------------------------------
  const rowSelectionProps = { highlightedLines, file: file.key, containerRef, onRangeSelected }
  const { selection, selectionHandle } = useRowSelection(rowSelectionProps)

  const rowControllerProps = { file, mode: effectiveMode, max: config.maxLinesToFetch, onLoadLines: onLoadMoreLines }
  const { hunkList, handleLoadLines } = useRowController(rowControllerProps)

  const overlayControllerProps = { overlays, lines: hunkList.linePairs, mode: effectiveMode, filepath: file.key }
  const { overlays: overlayGroups, overlayHandle } = useOverlayController(overlayControllerProps)

  // RENDER -----------------------------------------------------------------------------------
  const Loading = (
    <div css={[styles.bodyExpanded, styles.loadMoreContaier]}>
      <Spin />
      <Text type="secondary">Loading…</Text>
    </div>
  )

  const handleLoadClick = useCallback(() => {
    onForceRender?.(file.key)
    setContentReady(false)
  }, [file.key, onForceRender, setContentReady])

  const LoadMore = (
    <div css={[styles.bodyExpanded, styles.loadMoreContaier]}>
      <Text type="secondary">
        <a onClick={handleLoadClick}>This diff is too large to display. Click to load.</a>
      </Text>
    </div>
  )

  const BinaryDisclaimer = (
    <div css={styles.binaryMessageWrapper}>
      <Text type="secondary">Binary file not shown.</Text>
    </div>
  )

  const Diff = (
    <div css={viewerStyles.container}>
      <table css={viewerStyles.table}>
        <colgroup>
          {effectiveMode === 'unified' ? (
            <>
              <col style={{ width: '50px' }} />
              <col style={{ width: '50px' }} />
              <col style={{ width: 'auto' }} />
            </>
          ) : (
            <>
              <col style={{ width: '50px' }} />
              <col style={{ width: 'auto' }} />
              <col style={{ width: '50px' }} />
              <col style={{ width: 'auto' }} />
            </>
          )}
        </colgroup>
        <tbody>
          {hunkList.linePairs.map((line, idx) => {
            const lineType = line.typeLeft ?? 'empty'
            const isHunk = lineType === 'hunk'
            return (
              <DiffRow
                key={idx}
                idx={idx}
                css={viewerStyles.row}
                line={line}
                isHunk={isHunk}
                overlays={overlayGroups}
                widgets={fileWidgets}
                unified={effectiveMode === 'unified'}
                loadLines={(line, direction) => void handleLoadLines(line, direction)}
                onMouseEnter={overlayHandle.onRowEnter}
                onMouseLeave={overlayHandle.onRowLeave}
                onRowSelectionStart={selectionHandle.onStart}
                onRowSelectionUpdate={selectionHandle.onUpdate}
                onRowSelectionEnd={selectionHandle.onEnd}
                selectedRows={selection}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )

  useEffect(() => {
    // diff should render but not yet ready → schedule it
    if (!contentReady && (!lazyRender || !props.startCollapsed)) {
      const id =
        typeof window.requestIdleCallback === 'function'
          ? window.requestIdleCallback(() => setContentReady(true))
          : window.setTimeout(() => setContentReady(true), 30)

      return () => (typeof window.cancelIdleCallback === 'function' ? window.cancelIdleCallback(id) : clearTimeout(id))
    }
  }, [contentReady, lazyRender, props.startCollapsed])

  return (
    <div
      id={id}
      ref={(el) => {
        containerRef.current = el
        viewerRef(el)
      }}
    >
      <Header file={file} />

      {!shouldRender ? (
        Loading
      ) : (
        <div css={isCollapsed ? styles.bodyCollapsed : styles.bodyExpanded}>
          <div css={styles.hunksContainer}>
            {lazyRender && props.startCollapsed
              ? LoadMore
              : !contentReady
                ? Loading
                : file.isBinary
                  ? BinaryDisclaimer
                  : Diff}
          </div>
        </div>
      )}
    </div>
  )
}

FileViewerComponent.displayName = 'FileViewer'
export const FileViewer = React.memo(FileViewerComponent)
