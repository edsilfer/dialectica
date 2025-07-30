import React, { useCallback, useEffect, useRef, useState } from 'react'
import { LineRange } from '../../../models/LineExtensions'

type RowSide = 'left' | 'right'

type HighlightRowControllerProps = {
  /** Ref to the container element for detecting clicks outside */
  containerRef?: React.RefObject<HTMLDivElement | null>
  /** The initial highlighted lines range */
  highlightedLines?: LineRange
  /** The file key for the current file */
  file: string
  /** Callback when the selection is cleared */
  onClearSelection?: () => void
  /** Callback when a range is selected */
  onRangeSelected?: (range: LineRange) => void
}

type HighlightRowController = {
  /** The set of currently highlighted rows */
  selection: Set<number>
  /** Clear the current selection */
  selectionHandle: {
    clear: () => void
    /** Start a new selection */
    onStart: (index: number, side: RowSide) => void
    /** Update the current selection */
    onUpdate: (index: number) => void
    /** End the current selection */
    onEnd: () => void
  }
}

/**
 * Handle user-selected rows highlighting.
 *
 * PS: this is too complext to be kept together with use-row-controller
 *
 * @returns Public API:
 *  ├─ selectedRows            – set of currently highlighted rows
 *  ├─ handleRowSelectionStart – mouse‑down handler
 *  ├─ handleRowSelectionUpdate – mouse‑move handler
 *  └─ handleRowSelectionEnd   – mouse‑up handler (exposed for tests)
 */
export function useRowSelection(props: HighlightRowControllerProps): HighlightRowController {
  const { highlightedLines, file: fileKey, onRangeSelected, containerRef } = props

  const isDraggingRef = useRef(false)
  const draggedRowsRef = useRef<Set<number>>(new Set())
  const selectedSideRef = useRef<RowSide | null>(null)

  const [selectedRows, setSelectedRows] = useState<Set<number>>(
    () =>
      new Set(
        toSequentialArray(
          highlightedLines?.filepath === fileKey ? highlightedLines.start : undefined,
          highlightedLines?.filepath === fileKey ? highlightedLines.end : undefined,
        ),
      ),
  )

  /* --------------------------------------------------------------------------
   * Public event handlers
   * ----------------------------------------------------------------------- */
  const onStart = useCallback(
    (index: number, side: RowSide) => {
      // Clear the current selection if the user clicks the same row again
      if (selectedRows.size === 1 && selectedRows.has(index) && selectedSideRef.current === side) {
        isDraggingRef.current = false
        draggedRowsRef.current = new Set()
        setSelectedRows(new Set())
        return
      }

      isDraggingRef.current = true
      selectedSideRef.current = side
      draggedRowsRef.current = new Set([index])
      setSelectedRows(new Set([index]))
    },
    [selectedRows],
  )

  const onUpdate = useCallback((index: number) => {
    if (!isDraggingRef.current) return
    draggedRowsRef.current.add(index)
    setSelectedRows(new Set(draggedRowsRef.current))
  }, [])

  const onEnd = useCallback(() => {
    if (!isDraggingRef.current || draggedRowsRef.current.size === 0 || !selectedSideRef.current) {
      return
    }
    isDraggingRef.current = false

    const [start, end] = getRangeBounds(draggedRowsRef.current)
    const finalSelection = toSequentialSet(start, end)

    draggedRowsRef.current = finalSelection
    setSelectedRows(finalSelection)

    onRangeSelected?.({
      side: selectedSideRef.current,
      start,
      end,
      filepath: fileKey,
    })
  }, [fileKey, onRangeSelected])

  const clear = useCallback(() => {
    isDraggingRef.current = false
    draggedRowsRef.current = new Set()
    selectedSideRef.current = null
    setSelectedRows(new Set())
  }, [])

  /* --------------------------------------------------------------------------
   * Side‑effects
   * ----------------------------------------------------------------------- */
  useEffect(() => {
    const handleMouseUp = () => onEnd()
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [onEnd])

  /* Clear the selection when the user clicks anywhere outside the container */
  useEffect(() => {
    if (!containerRef) return

    const handleDocMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        clear()
      }
    }
    document.addEventListener('mousedown', handleDocMouseDown)
    return () => document.removeEventListener('mousedown', handleDocMouseDown)
  }, [clear, containerRef])

  return {
    selection: selectedRows,
    selectionHandle: {
      clear,
      onStart,
      onUpdate,
      onEnd,
    },
  }
}

/* =============================================================================
 * Private helpers
 * ========================================================================== */
function toSequentialArray(start?: number, end?: number): number[] {
  if (start === undefined || end === undefined) return []
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function toSequentialSet(start: number, end: number): Set<number> {
  return new Set(toSequentialArray(start, end))
}

function getRangeBounds(set: Set<number>): [number, number] {
  const sorted = [...set].sort((a, b) => a - b)
  return [sorted[0], sorted[sorted.length - 1]]
}
