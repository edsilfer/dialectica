import React, { useContext, useMemo } from 'react'
import { ThemeContext } from '../../../shared/providers/theme-context'
import LoadMoreButton from './buttons/LoadMoreButton'
import { useLoadMoreLines } from './hooks/use-load-more-lines'
import { getViewerStyles } from './shared-styles'
import { DiffLineType, UnifiedViewerProps } from './types'

/** Map diff-symbols shown at the start of each code cell */
const prefix: Record<DiffLineType, string> = {
  add: '+',
  delete: '-',
  context: ' ',
  hunk: ' ',
  empty: ' ',
}

const UnifiedViewer: React.FC<UnifiedViewerProps> = (props) => {
  const theme = useContext(ThemeContext)
  const styles = useMemo(() => getViewerStyles(theme), [theme])
  const { lines, loadMore } = useLoadMoreLines(props.sourceCode, props.onLoadMoreLines)

  return (
    <div css={styles.container} data-diff-container>
      <table css={styles.table}>
        <colgroup>
          <col style={{ width: '50px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: 'auto' }} />
        </colgroup>

        <tbody>
          {lines.map((line, idx) => {
            const lineType: DiffLineType = line.typeLeft ?? 'empty'
            const isHunk = lineType === 'hunk'

            return (
              <tr key={idx === 0 ? 'hunk-header' : `${lineType}-${idx}`} css={styles.row}>
                {isHunk ? (
                  <>
                    {/* number column(s) merged for the expander row */}
                    <td colSpan={2} css={styles.leftNumberCell[lineType]}>
                      <LoadMoreButton
                        direction={line.hunkDirection ?? 'out'}
                        onClick={(_, direction) => void loadMore(line, direction)}
                      />
                    </td>

                    <td css={styles.codeCell[lineType]}>
                      <span css={styles.lineType}>{prefix[lineType]}</span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: line.highlightedContentLeft ?? '&nbsp;',
                        }}
                      />
                    </td>
                  </>
                ) : (
                  <>
                    {/* LEFT NUMBER CELL */}
                    <td css={styles.leftNumberCell[lineType]}>{line.lineNumberLeft}</td>

                    {/* RIGHT NUMBER CELL */}
                    <td css={styles.rightNumberCell[lineType]}>{line.lineNumberRight}</td>

                    {/* CODE CELL */}
                    <td css={styles.codeCell[lineType]}>
                      <span css={styles.lineType}>{prefix[lineType]}</span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: line.highlightedContentLeft ?? '&nbsp;',
                        }}
                      />
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default UnifiedViewer
