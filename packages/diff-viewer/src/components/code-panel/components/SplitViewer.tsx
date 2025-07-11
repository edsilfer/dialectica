import React, { useContext, useEffect, useMemo, useRef } from 'react'
import { DiffLineType } from '../../../models/LineDiff'
import { ThemeContext } from '../../../themes/providers/theme-context'
import { useOverlayDocking } from '../hooks/use-overlay-docking'
import { DiffRow } from './DiffRow'
import { getViewerStyles } from './shared-styles'
import { SplitViewerProps } from './types'

const SplitViewer: React.FC<SplitViewerProps> = (props) => {
  const theme = useContext(ThemeContext)
  const styles = useMemo(() => getViewerStyles(theme), [theme])
  const containerRef = useRef<HTMLDivElement>(null)
  const rafIdRef = useRef<number | null>(null)

  const getSelectionSide = (sel: Selection | null): 'left' | 'right' | null => {
    if (!sel || sel.rangeCount === 0) return null
    const anchorNode = sel.anchorNode
    const anchorEl = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement
    if (!anchorEl) return null
    if (anchorEl.closest('.split-viewer-left-row')) return 'left'
    if (anchorEl.closest('.split-viewer-right-row')) return 'right'
    return null
  }

  useEffect(() => {
    const handleSelectionChange = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)

      rafIdRef.current = requestAnimationFrame(() => {
        const sel = window.getSelection()
        const has = !!(sel && sel.rangeCount && !sel.isCollapsed)
        const side = has ? getSelectionSide(sel) : null
        const container = containerRef.current
        if (!container) return

        container.classList.toggle('is-selecting', has)
        container.classList.toggle('selecting-left', has && side === 'left')
        container.classList.toggle('selecting-right', has && side === 'right')

        if (!has) {
          container.classList.remove('selecting-left', 'selecting-right')
        }
      })
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [])

  const { overlayGroups, handleRowEnter, handleRowLeave } = useOverlayDocking({
    overlays: props.overlays,
    lines: props.lines,
    viewMode: 'split',
  })

  return (
    <div css={styles.container} ref={containerRef}>
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
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default SplitViewer
