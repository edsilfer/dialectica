import { useCallback, useEffect, useRef } from 'react'

/**
 * Keeps the heights of corresponding left/right rows in a split diff viewer
 * equal by applying the max of both heights to each row. Returns a
 * `registerRow(side, index)` function which yields a ref callback that must
 * be attached to every <tr> on both sides.
 *
 * @param pairCount - The number of pairs of lines to sync
 * @param wrapLines - Whether to wrap lines
 * @param visible   - Whether the component is currently visible (skip operations if not)
 * @returns         - A function that registers a row for a given side and index
 */
export default function useRowHeightSync(pairCount: number, wrapLines?: boolean, visible = true) {
  const leftRows = useRef<(HTMLTableRowElement | null)[]>([])
  const rightRows = useRef<(HTMLTableRowElement | null)[]>([])
  const containerRef = useRef<HTMLElement | null>(null)
  const visibleRows = useRef<Set<number>>(new Set())

  // Stable registrar
  const registerRow = useCallback(
    (side: 'left' | 'right', index: number) => (el: HTMLTableRowElement | null) => {
      const bucket = side === 'left' ? leftRows.current : rightRows.current
      bucket[index] = el

      // Set container ref from first row to monitor the parent
      if (el && !containerRef.current) {
        containerRef.current = el.closest('[data-diff-container]') || (el.offsetParent as HTMLElement)
      }
    },
    [],
  )

  const syncVisibleRows = useCallback(() => {
    if (!pairCount || !visible) return

    requestAnimationFrame(() => {
      // Only sync rows that are currently visible
      visibleRows.current.forEach((i) => {
        const l = leftRows.current[i]
        const r = rightRows.current[i]
        if (!l || !r) return

        // Reset heights to measure natural height
        l.style.removeProperty('height')
        r.style.removeProperty('height')

        const lHeight = l.getBoundingClientRect().height
        const rHeight = r.getBoundingClientRect().height
        const maxHeight = Math.max(lHeight, rHeight)

        if (Math.abs(lHeight - rHeight) > 1) {
          // Only sync if there's a meaningful difference
          l.style.height = `${maxHeight}px`
          r.style.height = `${maxHeight}px`
        }
      })
    })
  }, [pairCount, visible])

  const syncAllRows = useCallback(() => {
    if (!pairCount || !visible) return

    // Reset heights first
    for (let i = 0; i < pairCount; i += 1) {
      leftRows.current[i]?.style.removeProperty('height')
      rightRows.current[i]?.style.removeProperty('height')
    }

    // Batch height sync in a single pass
    requestAnimationFrame(() => {
      for (let i = 0; i < pairCount; i += 1) {
        const l = leftRows.current[i]
        const r = rightRows.current[i]
        if (!l || !r) continue

        const lHeight = l.getBoundingClientRect().height
        const rHeight = r.getBoundingClientRect().height
        const maxHeight = Math.max(lHeight, rHeight)

        if (Math.abs(lHeight - rHeight) > 1) {
          // Only sync if there's a meaningful difference
          l.style.height = `${maxHeight}px`
          r.style.height = `${maxHeight}px`
        }
      }
    })
  }, [pairCount, visible])

  useEffect(() => {
    if (!pairCount || !visible) return

    // Guarantee length
    leftRows.current.length = pairCount
    rightRows.current.length = pairCount

    // For large diffs, use intersection observer to only sync visible rows
    const useIntersectionOptimization = pairCount > 100

    if (useIntersectionOptimization) {
      // Intersection observer to track visible rows
      const intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const row = entry.target as HTMLTableRowElement
            const index = Array.from(row.parentElement?.children || []).indexOf(row)

            if (entry.isIntersecting) {
              visibleRows.current.add(index)
            } else {
              visibleRows.current.delete(index)
            }
          })

          // Sync only visible rows
          syncVisibleRows()
        },
        {
          root: containerRef.current,
          rootMargin: '50px', // Preload rows slightly outside viewport
          threshold: 0.1,
        },
      )

      // Observe all rows
      for (let i = 0; i < pairCount; i += 1) {
        const l = leftRows.current[i]
        if (l) intersectionObserver.observe(l)
      }

      // Container resize observer with debouncing
      let timeoutId: NodeJS.Timeout | null = null
      const debouncedSync = () => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(syncVisibleRows, 16) // ~60fps
      }

      let resizeObserver: ResizeObserver | null = null
      if (containerRef.current) {
        resizeObserver = new ResizeObserver(debouncedSync)
        resizeObserver.observe(containerRef.current)
      }

      return () => {
        intersectionObserver.disconnect()
        resizeObserver?.disconnect()
        if (timeoutId) clearTimeout(timeoutId)
      }
    } else {
      // For smaller diffs, use the simpler approach
      syncAllRows()

      // Single ResizeObserver for the container
      let observer: ResizeObserver | null = null
      let timeoutId: NodeJS.Timeout | null = null

      const debouncedSync = () => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(syncAllRows, 16) // ~60fps
      }

      if (containerRef.current) {
        observer = new ResizeObserver(debouncedSync)
        observer.observe(containerRef.current)
      }

      // Also listen for font load events which can affect text height
      const handleFontLoad = () => debouncedSync()
      document.fonts?.addEventListener('loadingdone', handleFontLoad)

      return () => {
        observer?.disconnect()
        if (timeoutId) clearTimeout(timeoutId)
        document.fonts?.removeEventListener('loadingdone', handleFontLoad)
      }
    }
  }, [pairCount, wrapLines, visible, syncAllRows, syncVisibleRows])

  return registerRow
}
