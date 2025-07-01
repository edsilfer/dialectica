import React, { useLayoutEffect } from 'react'

/**
 * Keep two scrollable elements horizontally in sync.
 *
 * @param left    - The left table element.
 * @param right   - The right table element.
 * @param visible - Whether the component is currently visible (skip operations if not)
 */
export const useSynchronizedScroll = (
  left: React.RefObject<HTMLTableElement | null>,
  right: React.RefObject<HTMLTableElement | null>,
  visible = true,
) => {
  useLayoutEffect(() => {
    if (!visible) return

    const leftEl = left.current
    const rightEl = right.current
    if (!leftEl || !rightEl) return

    const isSyncing = { current: false }

    const sync = (source: HTMLElement, target: HTMLElement) => () => {
      if (isSyncing.current) return
      isSyncing.current = true
      target.scrollLeft = source.scrollLeft
      requestAnimationFrame(() => {
        isSyncing.current = false
      })
    }

    const handleLeft = sync(leftEl, rightEl)
    const handleRight = sync(rightEl, leftEl)

    leftEl.addEventListener('scroll', handleLeft)
    rightEl.addEventListener('scroll', handleRight)

    return () => {
      leftEl.removeEventListener('scroll', handleLeft)
      rightEl.removeEventListener('scroll', handleRight)
    }
  }, [left, right, visible])
}
