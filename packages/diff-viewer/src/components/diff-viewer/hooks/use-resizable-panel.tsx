import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MACBOOK_14_WIDTH } from '../../../utils/screen-utils'

/**
 * Get the initial percentage based on screen size
 * - MacBook 14" and smaller screens (≤1600px): 20%
 * - Larger screens (>1600px): 15%
 */
function getInitialPercentage(): number {
  if (typeof window === 'undefined') return 25 // SSR fallback
  return window.innerWidth <= MACBOOK_14_WIDTH ? 25 : 15
}

/**
 * Hook that encapsulates the logic for a horizontally resizable panel (the file explorer)
 *
 * @param initialPercentage - The initial percentage of the width of the panel. If not provided, it will be determined based on screen size.
 * @param min               - The same as initialPercentage
 * @param max               - The maximum percentage of the width of the panel.
 * @returns                 - The width of the panel, the ref to the container element, and the onMouseDown handler.
 */
export function useResizablePanel(
  initialPercentage?: number,
  {
    min,
    max = 60,
  }: {
    min?: number
    max?: number
  } = {},
) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(initialPercentage ?? getInitialPercentage())
  const [minWidth, setMinWidth] = useState(min ?? getInitialPercentage())
  const [dragging, setDragging] = useState(false)
  const [hasBeenManuallyResized, setHasBeenManuallyResized] = useState(false)

  // Listen for window resize events to update width when moving between monitors
  useEffect(() => {
    if (typeof window === 'undefined' || hasBeenManuallyResized) return

    const handleResize = () => {
      const newDefaultWidth = getInitialPercentage()
      const newMinWidth = getInitialPercentage()

      // Update minimum width for current screen size
      setMinWidth(newMinWidth)

      setWidth((currentWidth) => {
        const isAtDefaultSmallScreen = Math.abs(currentWidth - 25) < 1
        const isAtDefaultLargeScreen = Math.abs(currentWidth - 15) < 1

        if (isAtDefaultSmallScreen || isAtDefaultLargeScreen) {
          return newDefaultWidth
        }
        return currentWidth
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [hasBeenManuallyResized])

  // Optimized: Use refs to track drag state and avoid closures over stale values
  const dragStateRef = useRef({
    lastUpdateTime: 0,
    isRequestingFrame: false,
    startX: 0,
    startWidth: 0,
  })

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()

      // Mark the beginning of a drag so consumers can adjust styling (e.g. disable transitions)
      setDragging(true)

      const startX = e.clientX
      const startWidth = width

      // Store initial drag state
      dragStateRef.current.startX = startX
      dragStateRef.current.startWidth = startWidth
      dragStateRef.current.lastUpdateTime = 0
      dragStateRef.current.isRequestingFrame = false

      // Optimized: More aggressive throttling - limit updates to 60fps max (16.67ms intervals)
      const THROTTLE_MS = 16

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const now = performance.now()

        // Skip if we already have a pending frame request
        if (dragStateRef.current.isRequestingFrame) return

        // Additional throttling: skip updates that come too quickly
        if (now - dragStateRef.current.lastUpdateTime < THROTTLE_MS) return

        dragStateRef.current.isRequestingFrame = true
        dragStateRef.current.lastUpdateTime = now

        requestAnimationFrame(() => {
          dragStateRef.current.isRequestingFrame = false

          if (!containerRef.current) return
          const containerWidth = containerRef.current.clientWidth
          if (containerWidth === 0) return

          const deltaX = moveEvent.clientX - dragStateRef.current.startX
          const deltaPercent = (deltaX / containerWidth) * 100
          const nextWidth = Math.min(Math.max(dragStateRef.current.startWidth + deltaPercent, minWidth), max)

          // Optimized: Only update if the change is significant enough (reduces micro-updates)
          setWidth((prevWidth) => {
            const currentWidth = prevWidth ?? 0
            const significantChange = Math.abs(nextWidth - currentWidth) > 0.1
            return significantChange ? nextWidth : currentWidth
          })
        })
      }

      const removeListeners = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', removeListeners)

        // Clean up any pending animation frames
        if (dragStateRef.current.isRequestingFrame) {
          dragStateRef.current.isRequestingFrame = false
        }

        // Mark that the panel has been manually resized
        setHasBeenManuallyResized(true)
        setDragging(false)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', removeListeners)
    },
    [width, minWidth, max],
  )

  return { width, containerRef, onMouseDown, dragging }
}
