import { ThemeContext, useIsMobile } from '@edsilfer/commons'
import { css } from '@emotion/react'
import { theme as antTheme, Spin, Typography } from 'antd'
import React, { memo, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useContextSelector } from 'use-context-selector'

import { FileDiff } from '../../../../models/FileDiff'
import { LineRange, LoadMoreLinesHandler, Overlay, Widget } from '../../../../models/LineExtensions'
import { FileListConfigContext, useFileState } from '../../../../providers/file-list-context'
import { useOverlayController } from '../../hooks/use-overlay-controller'
import { useRowController } from '../../hooks/use-row-controller'
import { useRowSelection } from '../../hooks/use-row-selection'
import { LineMetadata } from '../../models/LineMetadata'
import { DiffRow } from '../rows/DiffRow'
import Header from './Header'
import { getViewerStyles } from './shared-styles'

const { Text } = Typography

const useStyles = () => {
  const theme = useContext(ThemeContext)
  const { token } = antTheme.useToken()

  return useMemo(() => {
    const viewer = getViewerStyles(theme, token)

    return {
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
      loadMoreContainer: css`
        display: flex;
        justify-content: center;
        gap: ${theme.spacing.md};
        align-items: center;
        padding: ${theme.spacing.md};
      `,
      viewerContainer: viewer.container,
      viewerTable: viewer.table,
      viewerRow: viewer.row,
    }
  }, [theme, token])
}

interface FileViewerProps {
  /** DOM id for the root element. */
  id?: string
  /** The file to display. */
  file: FileDiff
  /** The overlays to display. */
  overlays?: Overlay[]
  /** The widgets to display. */
  widgets?: Widget[]
  /** The lines to highlight. */
  highlightedLines?: LineRange
  /** Whether to start collapsed. */
  startCollapsed?: boolean
  /** The mode to use for the diff. */
  overrideMode?: 'unified' | 'split'
  /** Callback to force render the file. */
  onForceRender?: (fileKey: string) => void
  /** Callback to load more lines. */
  onLoadMoreLines?: LoadMoreLinesHandler
  /** Callback to select a range. */
  onRangeSelected?: (range: LineRange) => void
}

export const FileViewer = memo(function FileViewer(props: FileViewerProps) {
  const styles = useStyles()
  const isMobile = useIsMobile()

  const config = useContextSelector(FileListConfigContext, (ctx) => {
    if (!ctx) throw new Error('FileViewer must be within FileListConfigProvider')
    return ctx.config
  })

  const { file, id, overrideMode, onForceRender, startCollapsed = false } = props
  const lazyRender = startCollapsed
  const [{ inView: hasEnteredViewport }, setViewportState] = useState({ inView: !lazyRender })
  const [contentReady, setContentReady] = useState(!lazyRender || !startCollapsed)
  const [effectiveMode, setEffectiveMode] = useState<'unified' | 'split'>(overrideMode ?? config.mode)

  const { ref: ioRef, inView } = useInView(
    lazyRender ? { triggerOnce: true, rootMargin: '1000px' } : { triggerOnce: true, rootMargin: '0px' },
  )

  /* Keep DOM references lightweight and intentional. */
  const containerRef = useRef<HTMLDivElement>(null)
  const { isCollapsed } = useFileState(file.key)

  // EFFECTS ------------------------------------------------------------------------------------
  /* Force unified mode on handhelds */
  useEffect(() => {
    if (isMobile) setEffectiveMode(overrideMode ?? 'unified')
  }, [isMobile, overrideMode])

  /* Defer heavy markup until the diff scrolls near the viewport */
  useEffect(() => {
    if (!lazyRender || hasEnteredViewport) return
    if (inView) defer(() => setViewportState({ inView: true }))
  }, [inView, hasEnteredViewport, lazyRender])

  /* Once we decide to render, wait for an idle slot so we don’t block paint */
  useEffect(() => {
    if (contentReady || !hasEnteredViewport) return
    defer(() => setContentReady(true))
  }, [contentReady, hasEnteredViewport])

  return (
    <div
      id={id}
      ref={(el) => {
        containerRef.current = el
        ioRef(el)
      }}
    >
      <Header file={file} />

      {!hasEnteredViewport ? (
        <Loading styles={styles} />
      ) : (
        <div css={isCollapsed ? styles.bodyCollapsed : styles.bodyExpanded}>
          <div css={styles.hunksContainer}>
            {lazyRender && startCollapsed ? (
              <LoadMore styles={styles} onClick={() => handleLoadClick(file.key, onForceRender, setContentReady)} />
            ) : !contentReady ? (
              <Loading styles={styles} />
            ) : file.isBinary ? (
              <BinaryDisclaimer styles={styles} />
            ) : (
              <DiffTable
                {...props}
                containerRef={containerRef}
                maxLinesToFetch={config.maxLinesToFetch}
                effectiveMode={effectiveMode}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
})

/**
 * Schedules a callback during idle time or ASAP fallback to dodge main‑thread jank.
 */
function defer(cb: () => void) {
  const id =
    typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(cb) : window.setTimeout(cb, 30)
  return () => (typeof window.cancelIdleCallback === 'function' ? window.cancelIdleCallback(id) : clearTimeout(id))
}

function handleLoadClick(
  fileKey: string,
  onForceRender: FileViewerProps['onForceRender'],
  setContentReady: React.Dispatch<React.SetStateAction<boolean>>,
) {
  onForceRender?.(fileKey)
  setContentReady(false)
}

// -------------------------------------------------------------------------------------------------
// HELPER COMPONENTS
// -------------------------------------------------------------------------------------------------
function Loading({ styles }: { styles: ReturnType<typeof useStyles> }) {
  return (
    <div css={[styles.bodyExpanded, styles.loadMoreContainer]}>
      <Spin />
      <Text type="secondary">Loading…</Text>
    </div>
  )
}

function LoadMore({ styles, onClick }: { styles: ReturnType<typeof useStyles>; onClick: () => void }) {
  return (
    <div css={[styles.bodyExpanded, styles.loadMoreContainer]}>
      <Text type="secondary">
        <a onClick={onClick}>This diff is too large to display. Click to load.</a>
      </Text>
    </div>
  )
}

function BinaryDisclaimer({ styles }: { styles: ReturnType<typeof useStyles> }) {
  return (
    <div css={styles.binaryMessageWrapper}>
      <Text type="secondary">Binary file not shown.</Text>
    </div>
  )
}

/**
 * Renders the actual diff table. Extracted for readability.
 */
function DiffTable(
  props: FileViewerProps & {
    containerRef: React.RefObject<HTMLDivElement | null>
    maxLinesToFetch: number
    effectiveMode: 'unified' | 'split'
  },
) {
  const styles = useStyles()

  const fileWidgets = useMemo(
    () => (props.widgets ?? []).filter((w) => w.filepath === props.file.key),
    [props.widgets, props.file.key],
  )

  const { hunkList, handleLoadLines } = useRowController({
    file: props.file,
    mode: props.effectiveMode,
    max: props.maxLinesToFetch,
    onLoadLines: props.onLoadMoreLines,
  })

  const { overlays: overlayGroups, overlayHandle } = useOverlayController({
    overlays: props.overlays,
    lines: hunkList.linePairs,
    mode: props.effectiveMode,
    filepath: props.file.key,
  })

  const { selection, selectionHandle } = useRowSelection({
    highlightedLines: props.highlightedLines,
    file: props.file.key,
    containerRef: props.containerRef,
    onRangeSelected: props.onRangeSelected,
  })

  return (
    <div css={styles.viewerContainer}>
      <table css={styles.viewerTable}>
        <colgroup>
          {props.effectiveMode === 'unified' ? (
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
          {hunkList.linePairs.map((line: LineMetadata, idx: number) => {
            const isHunk = (line.typeLeft ?? 'empty') === 'hunk'
            return (
              <DiffRow
                key={idx}
                idx={idx}
                css={styles.viewerRow}
                line={line}
                isHunk={isHunk}
                overlays={overlayGroups}
                widgets={fileWidgets}
                unified={props.effectiveMode === 'unified'}
                loadLines={(ln, dir) => void handleLoadLines(ln, dir)}
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
}
