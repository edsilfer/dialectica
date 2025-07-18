import React, { useContext, useMemo } from 'react'
import { DiffLineType } from '../../../models/LineDiff'
import { ThemeContext } from '../../../themes/providers/theme-context'
import { useOverlayDocking } from '../hooks/use-overlay-docking'
import { DiffRow } from './DiffRow'
import { getViewerStyles } from './shared-styles'
import { UnifiedViewerProps } from './types'
import { theme as antTheme } from 'antd'

const UnifiedViewer: React.FC<UnifiedViewerProps> = (props) => {
  const theme = useContext(ThemeContext)
  const { token: antdThemeToken } = antTheme.useToken()
  const styles = useMemo(() => getViewerStyles(theme, antdThemeToken), [theme, antdThemeToken])

  const { overlayGroups, handleRowEnter, handleRowLeave } = useOverlayDocking({
    overlays: props.overlays,
    lines: props.lines,
    viewMode: 'unified',
    filepath: props.filepath,
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
          {props.lines.flatMap((line, idx) => {
            const lineType: DiffLineType = line.typeLeft ?? 'empty'
            const isHunk = lineType === 'hunk'
            const filteredOverlayGroups = overlayGroups
            const rows: React.ReactElement[] = []

            rows.push(
              <DiffRow
                idx={idx}
                key={idx}
                css={styles.row}
                line={line}
                isHunk={isHunk}
                overlays={filteredOverlayGroups}
                widgets={props.widgets}
                unified={true}
                highlightedLines={props.highlightedLines}
                loadLines={props.onLoadMoreLines}
                onMouseEnter={handleRowEnter}
                onMouseLeave={handleRowLeave}
              />,
            )

            return rows
          })}
        </tbody>
      </table>
    </div>
  )
}

export default UnifiedViewer
