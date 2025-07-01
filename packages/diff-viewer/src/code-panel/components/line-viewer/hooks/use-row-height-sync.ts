import { useCallback, useEffect, useRef } from 'react'

type Row = HTMLTableRowElement | null

/**
 * Global cache for storing row heights per content key.
 * Persists across component unmounts/remounts for the same content.
 * Cache keys combine content identifier with viewport dimensions to handle responsive layouts.
 */
const heightCache = new Map<string, Map<number, number>>()

/** Debounce utility optimized for different use cases (visibility vs resize events) */
const debounce = (fn: () => void, ms = 16) => {
  let timeoutId: number | undefined
  return () => {
    window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(fn, ms)
  }
}

/** Generate viewport-aware cache key for responsive height caching */
const createCacheKey = (contentKey: string, viewport = getViewportDimensions()) => `${contentKey}:${viewport}`

const getViewportDimensions = () =>
  typeof window === 'undefined' ? 'ssr' : `${window.innerWidth}x${window.innerHeight}`

/** Reset row heights to allow natural measurement */
const resetRowHeight = (row: Row) => row?.style.removeProperty('height')

/**
 * Synchronize row heights between left and right sides.
 * Applies the maximum height when the difference is visually significant (>1px).
 */
const syncRowHeights = (leftRow: Row, rightRow: Row): number | null => {
  if (!leftRow || !rightRow) return null

  const leftHeight = leftRow.getBoundingClientRect().height
  const rightHeight = rightRow.getBoundingClientRect().height
  const maxHeight = Math.max(leftHeight, rightHeight)

  if (Math.abs(leftHeight - rightHeight) > 1) {
    const heightValue = `${maxHeight}px`
    leftRow.style.height = heightValue
    rightRow.style.height = heightValue
  }

  return maxHeight
}

/**
 * Manages height cache with automatic cleanup to prevent memory leaks.
 * Keeps the most recent 40 entries when cache exceeds 50 items.
 */
const manageCacheSize = () => {
  if (heightCache.size <= 50) return

  const entries = Array.from(heightCache.entries())
  const oldestEntries = entries.slice(0, entries.length - 40)
  oldestEntries.forEach(([key]) => heightCache.delete(key))
}

/**
 * Keeps the heights of corresponding rows in a split diff synchronized.
 *
 * **Design Decisions:**
 * - Small diffs (<100 rows): Sync all rows immediately for better UX
 * - Large diffs: Use IntersectionObserver to only sync visible rows for performance
 * - Height caching: Prevents re-measurement when expanding/collapsing content
 * - Debouncing: 16ms for visibility changes (~60fps), 100ms for resize events
 * - requestAnimationFrame: Ensures height application happens after DOM updates
 */
export default function useRowHeightSync(
  pairCount: number,
  _wrapLines?: boolean, // Kept for backwards compatibility
  active = true,
  contentKey = 'default',
) {
  const leftRows = useRef<Row[]>([])
  const rightRows = useRef<Row[]>([])
  const scrollContainer = useRef<HTMLElement | null>(null)
  const visibleRowIndices = useRef<Set<number>>(new Set())
  const isActive = useRef(active)
  const initializationState = useRef({
    contentKey: '',
    viewportKey: '',
    isComplete: false,
  })

  const cacheKey = createCacheKey(contentKey)

  const applyOrCacheHeights = useCallback(
    (indices: number[], useCache = true) => {
      const cache = heightCache.get(cacheKey) || new Map<number, number>()

      if (!heightCache.has(cacheKey)) {
        heightCache.set(cacheKey, cache)
      }

      let appliedFromCache = 0

      for (const index of indices) {
        const leftRow = leftRows.current[index]
        const rightRow = rightRows.current[index]

        if (!leftRow || !rightRow) continue

        /** Try applying cached height first */
        if (useCache && cache.has(index)) {
          const cachedHeight = cache.get(index)!
          leftRow.style.height = `${cachedHeight}px`
          rightRow.style.height = `${cachedHeight}px`
          appliedFromCache++
          continue
        }

        /** Reset for natural measurement, then sync and cache */
        resetRowHeight(leftRow)
        resetRowHeight(rightRow)

        requestAnimationFrame(() => {
          if (!isActive.current) return

          const syncedHeight = syncRowHeights(leftRow, rightRow)
          if (syncedHeight) {
            cache.set(index, syncedHeight)
          }
        })
      }

      if (!useCache || appliedFromCache === 0) {
        manageCacheSize()
      }
    },
    [cacheKey],
  )

  const registerRow = useCallback(
    (side: 'left' | 'right', index: number) => (element: Row) => {
      const rowContainer = side === 'left' ? leftRows.current : rightRows.current
      rowContainer[index] = element

      if (element) {
        /** Capture scroll container for ResizeObserver */
        if (!scrollContainer.current) {
          scrollContainer.current = (element.closest('[data-diff-container]') ?? element.offsetParent) as HTMLElement
        }
        element.dataset.rowIndex = String(index)
      }
    },
    [],
  )

  const syncAllRows = useCallback(() => {
    const allIndices = Array.from({ length: pairCount }, (_, i) => i)
    applyOrCacheHeights(allIndices)
  }, [pairCount, applyOrCacheHeights])

  const syncVisibleRows = useCallback(() => {
    applyOrCacheHeights(Array.from(visibleRowIndices.current))
  }, [applyOrCacheHeights])

  useEffect(() => {
    if (!pairCount) return

    leftRows.current.length = pairCount
    rightRows.current.length = pairCount

    const currentState = initializationState.current
    const viewportKey = getViewportDimensions()
    const hasStateChanged =
      currentState.contentKey !== contentKey || currentState.viewportKey !== viewportKey || !currentState.isComplete

    if (hasStateChanged) {
      currentState.contentKey = contentKey
      currentState.viewportKey = viewportKey
      visibleRowIndices.current.clear()
    }

    /**
     * Performance strategy: Small diffs sync all rows, large diffs only sync visible ones.
     * This balances UX (immediate sync) with performance (selective sync).
     */
    const isLargeDiff = pairCount > 100
    const debouncedSyncVisible = debounce(syncVisibleRows, 16) // ~60fps for visibility
    const debouncedSyncForResize = debounce(isLargeDiff ? syncVisibleRows : syncAllRows, 100)

    /** Monitor container resize to re-sync when layout changes */
    const resizeObserver = scrollContainer.current ? new ResizeObserver(debouncedSyncForResize) : null
    resizeObserver?.observe(scrollContainer.current!)

    let intersectionObserver: IntersectionObserver | null = null

    if (isLargeDiff) {
      /** Track row visibility for performance in large diffs */
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const rowIndex = Number((entry.target as HTMLElement).dataset.rowIndex)
            if (Number.isNaN(rowIndex)) return

            if (entry.isIntersecting) {
              visibleRowIndices.current.add(rowIndex)
            } else {
              visibleRowIndices.current.delete(rowIndex)
            }
          })
          debouncedSyncVisible()
        },
        { root: scrollContainer.current, rootMargin: '50px', threshold: 0.1 },
      )

      leftRows.current.forEach((row) => row && intersectionObserver!.observe(row))
    } else if (hasStateChanged) {
      /** Initial sync for small diffs with font loading support */
      syncAllRows()

      const handleFontLoad = () =>
        applyOrCacheHeights(
          Array.from({ length: pairCount }, (_, i) => i),
          false,
        )

      document.fonts?.addEventListener('loadingdone', handleFontLoad)
      return () => document.fonts?.removeEventListener('loadingdone', handleFontLoad)
    }

    currentState.isComplete = true

    return () => {
      intersectionObserver?.disconnect()
      resizeObserver?.disconnect()
    }
  }, [pairCount, contentKey, syncAllRows, syncVisibleRows, applyOrCacheHeights])

  useEffect(() => {
    isActive.current = active
  }, [active])

  return registerRow
}
