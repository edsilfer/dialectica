import { css } from '@emotion/react'
import React, { useCallback, useContext, useLayoutEffect, useRef, useState, useMemo } from 'react'
import { ThemeContext } from '../../../shared/providers/theme-context'
import { useCodePanelConfig } from '../../providers/code-panel-context'
import DiffLine from '../line-viewer/DiffLine'
import useRowHeightSync from '../line-viewer/hooks/use-row-height-sync'
import { useSynchronizedScroll } from '../line-viewer/hooks/use-synchronize-scroll'
import { measurePrefixWidth } from '../line-viewer/lint-utils'
import { Side } from '../line-viewer/types'
import { SplitLineViewerProps } from './types'

const useStyles = (wrapLines: boolean) => {
  const theme = useContext(ThemeContext)

  return useMemo(
    () => ({
      container: css`
        display: flex;
        flex-direction: row;
        background-color: ${theme.colors.hunkViewerBg};
      `,

      table: css`
        width: 50%;
        border-collapse: collapse;
        table-layout: ${wrapLines ? 'auto' : 'fixed'};
        overflow-y: hidden;
        ${!wrapLines ? 'display: block; overflow-x: auto;' : ''}
      `,
    }),
    [theme, wrapLines],
  )
}

const SIDES: Side[] = ['left', 'right']

const SplitViewer: React.FC<SplitLineViewerProps> = ({
  pairs,
  wrapLines: initialWrapLines,
  visible = true,
  contentKey: propsContentKey,
}) => {
  const { config } = useCodePanelConfig()
  const wrapLines = initialWrapLines ?? true
  const styles = useStyles(wrapLines)

  // Use provided content key or generate one as fallback
  const contentKey = useMemo(() => {
    if (propsContentKey) {
      return `${propsContentKey}:wrap-${wrapLines}`
    }

    // Fallback: Create a hash of the content to identify identical data
    const contentString = pairs
      .map((pair) => {
        const leftContent = pair.left ? `${pair.left.type}:${pair.left.content}` : 'empty'
        const rightContent = pair.right ? `${pair.right.type}:${pair.right.content}` : 'empty'
        return `${leftContent}|${rightContent}`
      })
      .join('@@')

    return `split:${wrapLines}:${contentString.length}:${contentString.slice(0, 100)}`
  }, [propsContentKey, pairs, wrapLines])

  const registerRow = useRowHeightSync(pairs.length, wrapLines, visible, contentKey)

  const leftTableRef = useRef<HTMLTableElement>(null)
  const rightTableRef = useRef<HTMLTableElement>(null)

  const [prefixOffsets, setPrefixOffsets] = useState<Record<Side, number>>({
    left: 0,
    right: 0,
  })

  // Re-measure when the data changes (e.g. collapsed/expanded hunks).
  useLayoutEffect(() => {
    if (!visible) return
    setPrefixOffsets({
      left: measurePrefixWidth(leftTableRef.current),
      right: measurePrefixWidth(rightTableRef.current),
    })
  }, [pairs, visible])

  // Keep horizontal scrolling in sync between both tables.
  useSynchronizedScroll(leftTableRef, rightTableRef, visible)

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
                  type={line ? line.type : 'empty'}
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
    [pairs, prefixOffsets, registerRow, config.showLineNumbers, wrapLines, styles.table],
  )

  return (
    <div css={styles.container} data-diff-container>
      {SIDES.map(renderTable)}
    </div>
  )
}

export default SplitViewer
