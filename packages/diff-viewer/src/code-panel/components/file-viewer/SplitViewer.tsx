import React, { useContext, useMemo } from 'react'
import { ThemeContext } from '../../../shared/providers/theme-context'
import { getViewerStyles } from './style-utils'
import { DiffLineType, LinePair } from './types'

const SplitViewer: React.FC<{ lines: LinePair[] }> = ({ lines }) => {
  const theme = useContext(ThemeContext)
  const styles = useMemo(() => getViewerStyles(theme), [theme])
  // const [hovered, setHovered] = useState<{ row: number; side: Side } | null>(null)
  // const handleMouseEnter = (row: number, side: Side) => () => setHovered({ row, side })
  // const handleMouseLeave = () => setHovered(null)

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
          {lines.map((line, idx) => {
            const leftType: DiffLineType = line.typeLeft ?? 'empty'
            const rightType: DiffLineType = line.typeRight ?? 'empty'

            return (
              <tr key={idx} css={styles.row}>
                {/* LEFT SIDE */}
                <td css={styles.leftNumberCell[leftType]} className="split-viewer-left-row">
                  {line.lineNumberLeft}
                </td>

                <td css={styles.codeCell[leftType]} className="split-viewer-left-row">
                  <span>{preffix[leftType]}</span>
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
                  <span>{preffix[rightType]}</span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: line.highlightedContentRight ?? '&nbsp;',
                    }}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default SplitViewer
