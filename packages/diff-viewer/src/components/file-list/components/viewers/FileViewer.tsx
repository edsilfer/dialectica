import { css } from '@emotion/react'
import { notification } from 'antd'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useContextSelector } from 'use-context-selector'
import { FileDiff } from '../../../../models/FileDiff'
import { ThemeContext } from '../../../../../../commons/src/themes/providers/theme-context'
import { LineRange, LoadMoreLinesHandler, Overlay } from '../../../diff-viewer/types'
import { useHunkListViewModel } from '../../hooks/use-hunk-list-view-model'
import { useRowSelection } from '../../hooks/use-row-selection'
import { DiffLineViewModel } from '../../models/DiffLineViewModel'
import { CodePanelConfigContext, useFileState } from '../../providers/code-panel-context'
import FileViewerHeader from './FileViewerHeader'
import SplitViewer from './SplitViewer'
import { HunkDirection, Widget } from './types'
import UnifiedViewer from './UnifiedViewer'

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
    }),
    [theme],
  )
}

export interface FileViewerProps {
  /** A unique identifier for the file viewer. */
  id?: string
  /** The file diff object. */
  file: FileDiff
  /** Number of lines to request when user clicks "load more". Defaults to 5. */
  maxLinesToFetch?: number
  /** Array of overlays to display on top of line columns when hovered. */
  overlays?: Overlay[]
  /** Array of widgets to display at specific line positions. */
  widgets?: Widget[]
  /** The line range to highlight. */
  highlightedLines?: LineRange

  /** Called when user requests to load (expand) more lines around a hunk. */
  onLoadMoreLines?: LoadMoreLinesHandler
  /** Called when user selects a line range. */
  onRangeSelected?: (range: LineRange) => void
}

const FileViewer: React.FC<FileViewerProps> = (props) => {
  const { file, maxLinesToFetch, id, overlays, widgets, highlightedLines, onLoadMoreLines, onRangeSelected } = props
  const styles = useStyles()
  const config = useContextSelector(CodePanelConfigContext, (ctx) => {
    if (!ctx) throw new Error('FileViewer must be inside CodePanelConfigProvider')
    return ctx.config
  })
  const viewerRef = useRef<HTMLDivElement>(null)
  const { isCollapsed } = useFileState(file.key)
  const [wrapLines, setWrapLines] = useState<boolean>(true)

  const { selectedRows, handleRowSelectionStart, handleRowSelectionUpdate, handleRowSelectionEnd, clearSelection } =
    useRowSelection({
      highlightedLines,
      fileKey: file.key,
      onRangeSelected,
    })

  /* Clear the selection when the user clicks anywhere outside `viewerRef` */
  useEffect(() => {
    const handleDocMouseDown = (e: MouseEvent) => {
      if (viewerRef.current && !viewerRef.current.contains(e.target as Node)) {
        clearSelection()
      }
    }
    document.addEventListener('mousedown', handleDocMouseDown)
    return () => document.removeEventListener('mousedown', handleDocMouseDown)
  }, [clearSelection])

  // Filter widgets for this specific file
  const fileWidgets = useMemo(() => {
    if (!widgets) return undefined
    const filePath = file.newPath || file.oldPath
    return widgets.filter((widget) => widget.filepath === filePath)
  }, [widgets, file.newPath, file.oldPath])

  const { hunkList, dispatch } = useHunkListViewModel({
    file: file,
    mode: config.mode,
    maxLinesToFetch: maxLinesToFetch ?? 10,
  })

  const handleLoadMoreLines = useCallback(
    async (line: DiffLineViewModel, direction: HunkDirection) => {
      try {
        const ranges = hunkList.getLoadRange(line, direction)
        const result = await onLoadMoreLines?.({
          fileKey: file.key,
          leftRange: ranges.leftRange,
          rightRange: ranges.rightRange,
        })

        if (result) {
          dispatch({
            type: 'lines_loaded',
            payload: { line, result, direction },
          })
        }
      } catch (e: unknown) {
        notification.error({
          message: 'Error loading lines',
          description: `An error occurred while trying to load more lines. Please try again. ${String(e)}`,
          placement: 'topRight',
        })
      }
    },
    [dispatch, file.key, hunkList, onLoadMoreLines],
  )

  return (
    <div id={id} ref={viewerRef}>
      <FileViewerHeader file={file} onWrapLinesChange={setWrapLines} wrapLines={wrapLines} />

      <div css={isCollapsed ? styles.bodyCollapsed : styles.bodyExpanded}>
        <div css={styles.hunksContainer}>
          {config.mode === 'split' ? (
            <SplitViewer
              lines={hunkList.linePairs}
              filepath={file.newPath || file.oldPath}
              loadMoreLinesCount={maxLinesToFetch ?? 10}
              overlays={overlays}
              widgets={fileWidgets}
              onLoadMoreLines={(line: DiffLineViewModel, direction: HunkDirection) =>
                void handleLoadMoreLines(line, direction)
              }
              onRowSelectionStart={handleRowSelectionStart}
              onRowSelectionUpdate={handleRowSelectionUpdate}
              onRowSelectionEnd={handleRowSelectionEnd}
              selectedRows={selectedRows}
            />
          ) : (
            <UnifiedViewer
              lines={hunkList.linePairs}
              filepath={file.newPath || file.oldPath}
              wrapLines={wrapLines}
              visible={!isCollapsed}
              loadMoreLinesCount={maxLinesToFetch ?? 10}
              overlays={overlays}
              widgets={fileWidgets}
              onLoadMoreLines={(line, direction) => void handleLoadMoreLines(line, direction)}
              onRowSelectionStart={handleRowSelectionStart}
              onRowSelectionUpdate={handleRowSelectionUpdate}
              onRowSelectionEnd={handleRowSelectionEnd}
              selectedRows={selectedRows}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default FileViewer
