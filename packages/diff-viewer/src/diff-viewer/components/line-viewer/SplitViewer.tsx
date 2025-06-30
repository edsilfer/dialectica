import { css } from '@emotion/react'
import React, { useCallback, useContext, useLayoutEffect, useRef, useState } from 'react'
import { ThemeContext } from '../../../shared/providers/theme-provider'
import { useDiffViewerConfig } from '../../providers/diff-viewer-context'
import DiffLine from './DiffLine'
import useRowHeightSync from './hooks/use-row-height-sync'
import { useSynchronizedScroll } from './hooks/use-synchronize-scroll'
import { measurePrefixWidth } from './split-utils'
import type { Side, SplitLineViewerProps } from './types'

const useStyles = (wrapLines: boolean) => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: row;
      background-color: ${theme.colors.hunkViewerBg};
    `,

    table: css`
      width: 50%;
      border-collapse: collapse;
      table-layout: ${wrapLines ? 'auto' : 'fixed'};
      ${!wrapLines ? 'display: block; overflow-x: auto;' : ''}
    `,
  }
}

const SIDES: Side[] = ['left', 'right']

const SplitViewer: React.FC<SplitLineViewerProps> = ({ pairs }) => {
  const { config } = useDiffViewerConfig()
  const wrapLines = config.wrapLines ?? true
  const styles = useStyles(wrapLines)
  const registerRow = useRowHeightSync(pairs.length, wrapLines)

  const leftTableRef = useRef<HTMLTableElement>(null)
  const rightTableRef = useRef<HTMLTableElement>(null)

  const [prefixOffsets, setPrefixOffsets] = useState<Record<Side, number>>({
    left: 0,
    right: 0,
  })

  // Re-measure when the data changes (e.g. collapsed/expanded hunks).
  useLayoutEffect(() => {
    setPrefixOffsets({
      left: measurePrefixWidth(leftTableRef.current),
      right: measurePrefixWidth(rightTableRef.current),
    })
  }, [pairs])

  // Keep horizontal scrolling in sync between both tables.
  useSynchronizedScroll(leftTableRef, rightTableRef)

  /** Renders one of the two side-by-side tables. */
  const renderTable = useCallback(
    (side: Side) => {
      const isLeft = side === 'left'

      return (
        <table key={side} css={styles.table} ref={isLeft ? leftTableRef : rightTableRef}>
          <colgroup>
            <col />
            <col />
            <col />
          </colgroup>
          <tbody>
            {pairs.map((pair, i) => {
              const line = isLeft ? pair.left : pair.right
              const isHeader = pair.left?.type === 'hunk' || pair.right?.type === 'hunk'

              return (
                <DiffLine
                  ref={registerRow(side, i)}
                  key={`${side}-${i}`}
                  leftNumber={isLeft && line ? line.lineNumberOld : null}
                  rightNumber={!isLeft && line ? line.lineNumberNew : null}
                  hideRightNumber={isLeft}
                  hideLeftNumber={!isLeft}
                  content={!isLeft && isHeader ? '' : line ? line.highlightedContent : ''}
                  showNumber={!!config.showLineNumbers}
                  type={line ? (line.type as any) : 'empty'}
                  onAddButtonClick={() => console.log('Add comment clicked')}
                  wrapLines={wrapLines}
                  view="split"
                  stickyOffsets={{
                    rightNumber: 0,
                    prefix: prefixOffsets[side],
                  }}
                />
              )
            })}
          </tbody>
        </table>
      )
    },
    [pairs, prefixOffsets, registerRow, config.showLineNumbers, wrapLines],
  )

  return <div css={styles.container}>{SIDES.map(renderTable)}</div>
}

export default SplitViewer
