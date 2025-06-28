import { useCallback, useEffect, useRef } from 'react'

/**
 * Keeps the heights of corresponding left/right rows in a split diff viewer
 * equal by applying the max of both heights to each row. Returns a
 * `registerRow(side, index)` function which yields a ref callback that must
 * be attached to every <tr> on both sides.
 *
 * @param pairCount - The number of pairs of lines to sync
 * @returns         - A function that registers a row for a given side and index
 */
export default function useRowHeightSync(pairCount: number) {
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

    for (let i = 0; i < pairCount; i += 1) {
      const l = leftRows.current[i]
      const r = rightRows.current[i]
      if (!l || !r) continue

      const sync = () => {
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
  }, [pairCount])

  return registerRow
}
