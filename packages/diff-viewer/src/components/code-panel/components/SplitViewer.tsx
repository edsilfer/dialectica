import React, { useContext, useMemo } from 'react'
import { ThemeContext } from '../../../themes/providers/theme-context'
import { SplitViewerProps } from './types'
import { getViewerStyles } from './shared-styles'
import LoadMoreButton from '../../ui/buttons/LoadMoreButton'
import { DiffLineType } from '../../../models/LineDiff'

const SplitViewer: React.FC<SplitViewerProps> = (props) => {
  const theme = useContext(ThemeContext)
  const styles = useMemo(() => getViewerStyles(theme), [theme])

  const preffix: Record<DiffLineType, string> = {
    add: '+',
    delete: '-',
    context: ' ',
    hunk: ' ',
    empty: ' ',
  }

  return (
    <div css={styles.container} data-diff-container>
      <table css={styles.table}>
        <colgroup>
          <col style={{ width: '50px' }} />
          <col style={{ width: 'auto' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: 'auto' }} />
        </colgroup>
        <tbody>
          {props.lines.map((line, idx) => {
            const leftType: DiffLineType = line.typeLeft ?? 'empty'
            const rightType: DiffLineType = line.typeRight ?? 'empty'
            const isHunk = leftType === 'hunk' && rightType === 'hunk'

            return (
              <tr key={idx} css={styles.row}>
                {isHunk ? (
                  <>
                    {/* LEFT NUMBER CELL */}
                    <td css={styles.leftNumberCell['hunk']} className="split-viewer-left-row">
                      <LoadMoreButton
                        direction={line.hunkDirection ?? 'out'}
                        onClick={(_, direction) => {
                          props.onLoadMoreLines?.(line, direction)
                        }}
                      />
                    </td>

                    {/* MERGED CODE CELL (spans remaining 3 columns) */}
                    <td css={styles.codeCell['hunk']} colSpan={3}>
                      <span css={styles.lineType}>{preffix['hunk']}</span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: line.highlightedContentLeft ?? line.highlightedContentRight ?? '&nbsp;',
                        }}
                      />
                    </td>
                  </>
                ) : (
                  <>
                    {/* LEFT SIDE */}
                    <td css={styles.leftNumberCell[leftType]} className="split-viewer-left-row">
                      {leftType === 'hunk' ? (
                        <LoadMoreButton
                          direction={line.hunkDirection ?? 'out'}
                          onClick={(_, direction) => {
                            props.onLoadMoreLines?.(line, direction)
                          }}
                        />
                      ) : (
                        line.lineNumberLeft
                      )}
                    </td>

                    <td css={styles.codeCell[leftType]} className="split-viewer-left-row">
                      <span css={styles.lineType}>{preffix[leftType]}</span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: line.highlightedContentLeft ?? '&nbsp;',
                        }}
                      />
                    </td>

                    {/* RIGHT SIDE */}
                    <td css={styles.rightNumberCell[rightType]} className="split-viewer-right-row">
                      {line.lineNumberRight}
                    </td>

                    <td css={styles.codeCell[rightType]} className="split-viewer-right-row">
                      <span css={styles.lineType}>{preffix[rightType]}</span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: line.highlightedContentRight ?? '&nbsp;',
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

export default SplitViewer
