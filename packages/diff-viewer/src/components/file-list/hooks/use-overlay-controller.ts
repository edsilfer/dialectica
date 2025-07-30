import debounce from 'lodash/debounce'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { Overlay } from '../../../models/LineExtensions'
import { LineMetadata } from '../models/LineMetadata'

interface OverlayControllerProps {
  /** Array of overlays to display on top of line columns when hovered. */
  overlays?: Overlay[]
  /** Lines to display */
  lines: LineMetadata[]
  /** Whether this is unified view (true) or split view (false) */
  mode: 'unified' | 'split'
  /** The path of the file being displayed. */
  filepath: string
}

interface OverlayController {
  /** Groups of overlays by dock index */
  overlays: Record<number, React.ReactNode[]>
  overlayHandle: {
    /** Handler for when the row is hovered */
    onRowEnter: (e: React.MouseEvent<HTMLTableRowElement>) => void
    /** Handler for when the row is not hovered */
    onRowLeave: (e: React.MouseEvent<HTMLTableRowElement>) => void
  }
}

export const useOverlayController = (props: OverlayControllerProps): OverlayController => {
  const { overlays, lines, mode, filepath } = props
  const lastIdxRef = useRef<number | null>(null)

  const overlayGroups = useMemo(() => {
    if (!overlays?.length) return {}
    const groups: Record<number, React.ReactNode[]> = {}
    overlays.forEach((o) => {
      const dockIndex = mode === 'unified' ? o.unifiedDockIdx : o.splitDockIdx
      ;(groups[dockIndex] ??= []).push(o.content)
    })

    return groups
  }, [overlays, mode])

  const dispatch = useMemo(
    () =>
      debounce((line: LineMetadata, overlays: Overlay[]) => {
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
    (isHovering: boolean) => (e: React.MouseEvent<HTMLTableRowElement>) => {
      const idx = Number((e.currentTarget as HTMLTableRowElement).dataset.idx ?? -1)
      if (idx < 0) return

      if (!isHovering) {
        lastIdxRef.current = null
        dispatch.cancel()
        return
      }

      if (idx === lastIdxRef.current) return
      lastIdxRef.current = idx
      const line = lines[idx]
      window.dispatchEvent(new CustomEvent('overlay-visible', { detail: { line, idx } }))

      if (overlays) dispatch(line, overlays)
    },
    [lines, overlays, dispatch],
  )

  return {
    overlays: overlayGroups,
    overlayHandle: {
      onRowEnter: doDock(true),
      onRowLeave: doDock(false),
    },
  }
}
