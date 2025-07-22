import { theme as antTheme } from 'antd'
import React, { useContext, useMemo } from 'react'
import { DiffLineType } from '../../../../models/LineDiff'
import { ThemeContext } from '../../../../../../commons/src/themes/providers/theme-context'
import { useOverlayDocking } from '../../hooks/use-overlay-docking'

import { DiffRow } from '../rows/DiffRow'
import { getViewerStyles } from './shared-styles'
import { SplitViewerProps } from './types'

const SplitViewer: React.FC<SplitViewerProps> = (props) => {
  const theme = useContext(ThemeContext)
  const { token: antdThemeToken } = antTheme.useToken()
  const styles = useMemo(() => getViewerStyles(theme, antdThemeToken), [theme, antdThemeToken])

  const { overlayGroups, handleRowEnter, handleRowLeave } = useOverlayDocking({
    overlays: props.overlays,
    lines: props.lines,
    viewMode: 'split',
    filepath: props.filepath,
  })

  return (
    <div css={styles.container}>
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
              <DiffRow
                key={idx}
                idx={idx}
                line={line}
                isHunk={isHunk}
                overlays={overlayGroups}
                widgets={props.widgets}
                loadLines={props.onLoadMoreLines}
                unified={false}
                onMouseEnter={handleRowEnter}
                onMouseLeave={handleRowLeave}
                onRowSelectionStart={props.onRowSelectionStart}
                onRowSelectionUpdate={props.onRowSelectionUpdate}
                onRowSelectionEnd={props.onRowSelectionEnd}
                selectedRows={props.selectedRows}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default SplitViewer
