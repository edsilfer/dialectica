import React, { useContext, useMemo } from 'react'
import LoadMoreLines from '../../../shared/icons/LoadMoreLines'
import { ThemeContext } from '../../../shared/providers/theme-context'
import { getViewerStyles } from './style-utils'
import { DiffLineType, UnifiedViewerProps } from './types'

const UnifiedViewer: React.FC<UnifiedViewerProps> = (props) => {
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
          <col style={{ width: '50px' }} />
          <col style={{ width: 'auto' }} />
        </colgroup>

        <tbody>
          {props.lines.map((line, idx) => {
            const lineType: DiffLineType = line.typeLeft ?? 'empty'
            return (
              <tr key={idx === 0 ? 'hunk-header' : `${lineType}-${idx}`} css={styles.row}>
                {
                  <td css={styles.leftNumberCell[lineType]}>
                    {lineType === 'hunk' ? <LoadMoreLines size={24} direction="bi-directional" /> : line.lineNumberLeft}
                  </td>
                }

                {<td css={styles.rightNumberCell[lineType]}>{line.lineNumberRight}</td>}

                <td css={styles.codeCell[lineType]}>
                  <span>{preffix[lineType]}</span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: line.highlightedContentLeft ?? '&nbsp;',
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

export default UnifiedViewer
