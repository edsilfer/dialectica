import { css } from '@emotion/react'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { useContextSelector } from 'use-context-selector'
import { ThemeContext } from '../../../../themes/providers/theme-context'
import { CodePanelConfigContext, useFileState } from '../../providers/code-panel-context'
import { useHunkListViewModel } from './hooks/use-hunk-list-view-model'
import HunkListHeader from './HunkListHeader'
import { LinePair } from './models/LinePair'
import SplitViewer from './SplitViewer'
import { HunkDirection, HunkListProps } from './types'
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

const HunkList: React.FC<HunkListProps> = (props) => {
  const { file, maxLinesToFetch, onLoadMoreLines, id } = props
  const styles = useStyles()
  const config = useContextSelector(CodePanelConfigContext, (ctx) => {
    if (!ctx) throw new Error('FileViewer must be inside CodePanelConfigProvider')
    return ctx.config
  })
  const { isCollapsed, isViewed, toggleCollapsed, toggleViewed } = useFileState(file.key)
  const [wrapLines, setWrapLines] = useState<boolean>(true)

  const { hunkList, dispatch } = useHunkListViewModel({
    file: file,
    mode: config.mode,
    maxLinesToFetch: maxLinesToFetch ?? 10,
  })

  const handleLoadMoreLines = useCallback(
    async (line: LinePair, direction: HunkDirection) => {
      const [start, end] = hunkList.getLoadRange(line, direction)
      const extraLines: Map<number, string> | undefined = await onLoadMoreLines?.({
        fileKey: file.key,
        startLine: start,
        endLine: end,
      })

      if (extraLines) {
        dispatch({
          type: 'lines_loaded',
          payload: { line, extraLines, direction },
        })
      }
    },
    [dispatch, file.key, hunkList, onLoadMoreLines],
  )

  return (
    <div id={id}>
      <HunkListHeader
        file={file}
        filePath={hunkList.filePath}
        isCollapsed={isCollapsed}
        isViewed={isViewed}
        mode={config.mode}
        onWrapLinesChange={setWrapLines}
        toggleCollapsed={toggleCollapsed}
        toggleViewed={toggleViewed}
        wrapLines={wrapLines}
      />

      <div css={isCollapsed || isViewed ? styles.bodyCollapsed : styles.bodyExpanded}>
        <div css={styles.hunksContainer}>
          {config.mode === 'split' && (
            <SplitViewer
              lines={hunkList.linePairs}
              onLoadMoreLines={(line, direction) => void handleLoadMoreLines(line, direction)}
              loadMoreLinesCount={maxLinesToFetch}
            />
          )}
          {config.mode === 'unified' && (
            <UnifiedViewer
              lines={hunkList.linePairs}
              wrapLines={wrapLines}
              visible={!isCollapsed}
              onLoadMoreLines={(line, direction) => void handleLoadMoreLines(line, direction)}
              loadMoreLinesCount={maxLinesToFetch}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default HunkList
