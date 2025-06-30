import { useCallback, useEffect, useRef } from 'react'

/**
 * Keeps the heights of corresponding left/right rows in a split diff viewer
 * equal by applying the max of both heights to each row. Returns a
 * `registerRow(side, index)` function which yields a ref callback that must
 * be attached to every <tr> on both sides.
 *
 * @param pairCount - The number of pairs of lines to sync
 * @param wrapLines - Whether to wrap lines
 * @returns         - A function that registers a row for a given side and index
 */
export default function useRowHeightSync(pairCount: number, wrapLines?: boolean) {
  const leftRows = useRef<(HTMLTableRowElement | null)[]>([])
  const rightRows = useRef<(HTMLTableRowElement | null)[]>([])

  // Stable registrar
  const registerRow = useCallback(
    (side: 'left' | 'right', index: number) => (el: HTMLTableRowElement | null) => {
      const bucket = side === 'left' ? leftRows.current : rightRows.current
      bucket[index] = el
    },
    [],
  )

  useEffect(() => {
    if (!pairCount) return

    // Guarantee length
    leftRows.current.length = pairCount
    rightRows.current.length = pairCount

    const observers: ResizeObserver[] = []

    /**
     * Reset any inline height that might have been applied during a previous
     * synchronization so that the natural height of each row (which may have
     * changed after toggling line wrapping) can be measured accurately.
     */
    for (let i = 0; i < pairCount; i += 1) {
      leftRows.current[i]?.style.removeProperty('height')
      rightRows.current[i]?.style.removeProperty('height')
    }

    for (let i = 0; i < pairCount; i += 1) {
      const l = leftRows.current[i]
      const r = rightRows.current[i]
      if (!l || !r) continue

      const sync = () => {
        /**
         * Remove any previously applied fixed height so we can measure the row's
         * natural height after layout changes (e.g. viewport resize that
         * changes line wrapping). Then measure the new (natural) heights of
         * both rows and apply the larger of the two to ensure they remain
         * visually aligned. We need to do this to handle situations like screen resize
         */
        l.style.removeProperty('height')
        r.style.removeProperty('height')
        const max = Math.max(l.getBoundingClientRect().height, r.getBoundingClientRect().height)
        l.style.height = `${max}px`
        r.style.height = `${max}px`
      }

      sync() // initial

      const ro = new ResizeObserver(sync)
      ro.observe(l)
      ro.observe(r)
      observers.push(ro)
    }

    return () => observers.forEach((o) => o.disconnect())
  }, [pairCount, wrapLines])

  return registerRow
}
