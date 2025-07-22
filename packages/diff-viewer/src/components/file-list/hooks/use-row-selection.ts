import { useCallback, useEffect, useRef, useState } from 'react'
import { LineRange } from '../../diff-viewer/types'

type RowSide = 'left' | 'right'

type UseRowSelectionProps = {
  /** The initial highlighted lines range */
  highlightedLines?: LineRange
  /** The file key for the current file */
  fileKey: string

  /** Callback when the selection is cleared */
  onClearSelection?: () => void
  /** Callback when a range is selected */
  onRangeSelected?: (range: LineRange) => void
}

/**
 * Handle user-selected rows highlighting.
 *
 * @returns Public API:
 *  ├─ selectedRows            – set of currently highlighted rows
 *  ├─ handleRowSelectionStart – mouse‑down handler
 *  ├─ handleRowSelectionUpdate – mouse‑move handler
 *  └─ handleRowSelectionEnd   – mouse‑up handler (exposed for tests)
 */
export function useRowSelection(props: UseRowSelectionProps) {
  const { highlightedLines, fileKey, onRangeSelected } = props

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
  const onSelectionStart = useCallback(
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

  const onSelectoinUpdate = useCallback((index: number) => {
    if (!isDraggingRef.current) return
    draggedRowsRef.current.add(index)
    setSelectedRows(new Set(draggedRowsRef.current))
  }, [])

  const onSelectionEnd = useCallback(() => {
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

  const clearSelection = useCallback(() => {
    isDraggingRef.current = false
    draggedRowsRef.current = new Set()
    selectedSideRef.current = null
    setSelectedRows(new Set())
  }, [])

  /* --------------------------------------------------------------------------
   * Side‑effects
   * ----------------------------------------------------------------------- */
  useEffect(() => {
    const handleMouseUp = () => onSelectionEnd()
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [onSelectionEnd])

  return {
    selectedRows,
    clearSelection,
    handleRowSelectionStart: onSelectionStart,
    handleRowSelectionUpdate: onSelectoinUpdate,
    handleRowSelectionEnd: onSelectionEnd,
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
