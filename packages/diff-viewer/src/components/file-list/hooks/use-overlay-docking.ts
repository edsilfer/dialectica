import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import debounce from 'lodash/debounce'
import { Overlay } from '../../diff-viewer/types'
import { DiffLineViewModel } from '../models/DiffLineViewModel'

interface UseOverlayDockingProps {
  /** Array of overlays to display on top of line columns when hovered. */
  overlays?: Overlay[]
  /** Lines to display */
  lines: DiffLineViewModel[]
  /** Whether this is unified view (true) or split view (false) */
  viewMode: 'unified' | 'split'
  /** The path of the file being displayed. */
  filepath: string
}

interface UseOverlayDockingReturn {
  /** Groups of overlays by dock index */
  overlayGroups: Record<number, React.ReactNode[]>
  /** Handler for when the row is hovered */
  handleRowEnter: (e: React.MouseEvent<HTMLTableRowElement>) => void
  /** Handler for when the row is not hovered */
  handleRowLeave: (e: React.MouseEvent<HTMLTableRowElement>) => void
}

export const useOverlayDocking = ({
  overlays,
  lines,
  viewMode,
  filepath,
}: UseOverlayDockingProps): UseOverlayDockingReturn => {
  const overlayGroups = useMemo(() => {
    if (!overlays?.length) return {}
    const groups: Record<number, React.ReactNode[]> = {}
    overlays.forEach((o) => {
      const dockIndex = viewMode === 'unified' ? o.unifiedDockIdx : o.splitDockIdx
      ;(groups[dockIndex] ??= []).push(o.content)
    })

    return groups
  }, [overlays, viewMode])

  const lastIdxRef = useRef<number | null>(null)

  const dispatch = useMemo(
    () =>
      debounce((line: DiffLineViewModel, overlays: Overlay[]) => {
        overlays?.forEach((overlay) => {
          if (!overlay.onDock) return
          let lineNumber = line.lineNumberLeft ?? line.lineNumberRight ?? undefined
          type SideType = 'left' | 'right' | undefined
          let side: SideType = line.lineNumberLeft ? 'left' : line.lineNumberRight ? 'right' : undefined
          let content = line.contentLeft ?? line.contentRight ?? undefined
          overlay.onDock({ lineNumber, side, content, filepath })
        })
      }, 100),
    [filepath],
  )

  useEffect(() => dispatch.cancel(), [dispatch])

  const doDock = useCallback(
    (idx: number, isHovering: boolean) => {
      if (!isHovering) {
        lastIdxRef.current = null
        dispatch.cancel()
        return
      }

      if (idx === lastIdxRef.current) return
      lastIdxRef.current = idx
      const line = lines[idx]
      window.dispatchEvent(new CustomEvent('overlay-visible', { detail: { line, idx } }))

      if (overlays) {
        dispatch(line, overlays)
      }
    },
    [lines, overlays, dispatch],
  )

  const handleRowEnter = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>) => {
      const idx = Number((e.currentTarget as HTMLTableRowElement).dataset.idx ?? -1)
      if (idx >= 0) doDock(idx, true)
    },
    [doDock],
  )

  const handleRowLeave = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>) => {
      const idx = Number((e.currentTarget as HTMLTableRowElement).dataset.idx ?? -1)
      if (idx >= 0) doDock(idx, false)
    },
    [doDock],
  )

  return {
    overlayGroups,
    handleRowEnter,
    handleRowLeave,
  }
}
