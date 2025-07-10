import React, { useContext, useEffect, useMemo, useRef } from 'react'
import { DiffLineType } from '../../../models/LineDiff'
import { ThemeContext } from '../../../themes/providers/theme-context'
import LoadMoreButton from '../../ui/buttons/LoadMoreButton'
import DiffCell from './DiffCell'
import { getViewerStyles } from './shared-styles'
import { SplitViewerProps } from './types'
import { useOverlayDocking } from '../hooks/use-overlay-docking'

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
              <tr key={idx} css={styles.row} data-idx={idx} onMouseEnter={handleRowEnter} onMouseLeave={handleRowLeave}>
                {isHunk ? (
                  <>
                    {/* LEFT NUMBER CELL */}
                    <td
                      css={styles.leftNumberCell['hunk']}
                      className="split-viewer-left-row"
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      <LoadMoreButton
                        direction={line.hunkDirection ?? 'out'}
                        onClick={(_, direction) => {
                          props.onLoadMoreLines?.(line, direction)
                        }}
                      />
                    </td>

                    {/* MERGED CODE CELL (spans remaining 3 columns) */}
                    <td css={styles.codeCell['hunk']} colSpan={3}>
                      <span css={styles.lineType}> </span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: line.highlightedContentLeft ?? line.highlightedContentRight ?? '&nbsp;',
                        }}
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <DiffCell
                      line={line}
                      side="left"
                      lineType={leftType}
                      isHunk={leftType === 'hunk'}
                      overlayGroups={overlayGroups}
                      className="split-viewer-left-row"
                      numberCellStyle={{ userSelect: 'none' as const, pointerEvents: 'none' as const }}
                      onLoadMoreLines={props.onLoadMoreLines}
                      unified={false}
                    />
                    <DiffCell
                      line={line}
                      side="right"
                      lineType={rightType}
                      isHunk={rightType === 'hunk'}
                      overlayGroups={overlayGroups}
                      className="split-viewer-right-row"
                      onLoadMoreLines={props.onLoadMoreLines}
                      unified={false}
                    />
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
