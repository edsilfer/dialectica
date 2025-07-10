import { css } from '@emotion/react'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { useContextSelector } from 'use-context-selector'
import { notification } from 'antd'
import { ThemeContext } from '../../../themes/providers/theme-context'
import { CodePanelConfigContext, useFileState } from '../providers/code-panel-context'
import { HunkDirection, FileViewerProps } from './types'
import { useHunkListViewModel } from '../hooks/use-hunk-list-view-model'
import { DiffLineViewModel } from '../models/DiffLineViewModel'
import FileViewerHeader from './FileViewerHeader'
import SplitViewer from './SplitViewer'
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

const FileViewer: React.FC<FileViewerProps> = (props) => {
  const { file, maxLinesToFetch, onLoadMoreLines, id, overlays } = props
  const styles = useStyles()
  const config = useContextSelector(CodePanelConfigContext, (ctx) => {
    if (!ctx) throw new Error('FileViewer must be inside CodePanelConfigProvider')
    return ctx.config
  })
  const { isCollapsed } = useFileState(file.key)
  const [wrapLines, setWrapLines] = useState<boolean>(true)

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
    <div id={id}>
      <FileViewerHeader file={file} onWrapLinesChange={setWrapLines} wrapLines={wrapLines} />

      <div css={isCollapsed ? styles.bodyCollapsed : styles.bodyExpanded}>
        <div css={styles.hunksContainer}>
          {config.mode === 'split' && (
            <SplitViewer
              lines={hunkList.linePairs}
              onLoadMoreLines={(line: DiffLineViewModel, direction: HunkDirection) =>
                void handleLoadMoreLines(line, direction)
              }
              loadMoreLinesCount={maxLinesToFetch ?? 10}
              overlays={overlays}
            />
          )}
          {config.mode === 'unified' && (
            <UnifiedViewer
              lines={hunkList.linePairs}
              wrapLines={wrapLines}
              visible={!isCollapsed}
              onLoadMoreLines={(line, direction) => void handleLoadMoreLines(line, direction)}
              loadMoreLinesCount={maxLinesToFetch ?? 10}
              overlays={overlays}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default FileViewer
