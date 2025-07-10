import React, { useContext, useMemo } from 'react'
import { DiffLineType } from '../../../models/LineDiff'
import { ThemeContext } from '../../../themes/providers/theme-context'
import { useOverlayDocking } from '../hooks/use-overlay-docking'
import DiffCell from './DiffCell'
import { getViewerStyles } from './shared-styles'
import { UnifiedViewerProps } from './types'

const UnifiedViewer: React.FC<UnifiedViewerProps> = (props) => {
  const theme = useContext(ThemeContext)
  const styles = useMemo(() => getViewerStyles(theme), [theme])

  const { overlayGroups, handleRowEnter, handleRowLeave } = useOverlayDocking({
    overlays: props.overlays,
    lines: props.lines,
    viewMode: 'unified',
  })

  return (
    <div css={styles.container}>
      <table css={styles.table}>
        <colgroup>
          <col style={{ width: '50px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: 'auto' }} />
        </colgroup>

        <tbody>
          {props.lines.map((line, idx) => {
            const lineType: DiffLineType = line.typeLeft ?? 'empty'
            const isHunk = lineType === 'hunk'
            const filteredOverlayGroups = overlayGroups

            return (
              <tr
                key={idx === 0 ? 'hunk-header' : `${lineType}-${idx}`}
                css={styles.row}
                data-idx={idx}
                onMouseEnter={handleRowEnter}
                onMouseLeave={handleRowLeave}
              >
                <DiffCell
                  line={line}
                  side="left"
                  lineType={lineType}
                  isHunk={isHunk}
                  overlayGroups={filteredOverlayGroups}
                  onLoadMoreLines={props.onLoadMoreLines}
                  unified={true}
                />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default UnifiedViewer
