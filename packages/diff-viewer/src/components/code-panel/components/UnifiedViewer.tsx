import React, { useContext, useMemo } from 'react'
import { DiffLineType } from '../../../models/LineDiff'
import { ThemeContext } from '../../../themes/providers/theme-context'
import { useOverlayDocking } from '../hooks/use-overlay-docking'
import DiffCell from './DiffCell'
import { getViewerStyles } from './shared-styles'
import { UnifiedViewerProps, Widget } from './types'

const UnifiedViewer: React.FC<UnifiedViewerProps> = (props) => {
  const theme = useContext(ThemeContext)
  const styles = useMemo(() => getViewerStyles(theme), [theme])

  // Pre‑group widgets by line and position so we don’t do O(n*m) scans while rendering.
  const widgetMap = useMemo(() => {
    const map = new Map<number, { top: Widget[]; bottom: Widget[] }>()
    props.widgets?.forEach((widget) => {
      const entry = map.get(widget.line) ?? { top: [] as Widget[], bottom: [] as Widget[] }
      entry[widget.position].push(widget)
      map.set(widget.line, entry)
    })
    return map
  }, [props.widgets])

  const { overlayGroups, handleRowEnter, handleRowLeave } = useOverlayDocking({
    overlays: props.overlays,
    lines: props.lines,
    viewMode: 'unified',
  })

  /** Pick the most relevant unified line number (left, right or fallback to idx). */
  const getUnifiedLineNumber = (
    line: { lineNumberLeft: number | null; lineNumberRight: number | null },
    idx: number,
  ): number => line.lineNumberLeft ?? line.lineNumberRight ?? idx

  /** Render widget rows for a given position so we can avoid duplicate mapping logic. */
  const renderWidgetRows = (widgets: Widget[] | undefined, lineNumber: number, position: 'top' | 'bottom') =>
    widgets?.map((widget, wIdx) => (
      <tr key={`widget-${position}-${lineNumber}-${wIdx}`}>
        <td colSpan={3}>{widget.content}</td>
      </tr>
    )) ?? []

  /*
   * Keep track of which unified line numbers have already had widget rows rendered,
   * so we don’t show the same comment twice when both deletion and insertion lines
   * share the same `lineNumber` in unified view.
   */
  const renderedTop = new Set<number>()
  const renderedBottom = new Set<number>()

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
            const lineNumber = getUnifiedLineNumber(line, idx)
            const widgetsForLine = widgetMap.get(lineNumber)
            const rows: React.ReactElement[] = []

            // widgets placed *above* the diff line (only once per unified line number)
            if (!renderedTop.has(lineNumber)) {
              rows.push(...renderWidgetRows(widgetsForLine?.top, lineNumber, 'top'))
              renderedTop.add(lineNumber)
            }

            rows.push(
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
              </tr>,
            )

            // widgets placed *below* the diff line (only once per unified line number)
            if (!renderedBottom.has(lineNumber)) {
              rows.push(...renderWidgetRows(widgetsForLine?.bottom, lineNumber, 'bottom'))
              renderedBottom.add(lineNumber)
            }

            return rows
          })}
        </tbody>
      </table>
    </div>
  )
}

export default UnifiedViewer
