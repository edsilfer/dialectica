import { useCallback, useRef, useState } from 'react'

/**
 * Hook that encapsulates the logic for a horizontally resizable panel (the file explorer)
 *
 * @param initialPercentage - The initial percentage of the width of the panel.
 * @param min               - The minimum percentage of the width of the panel.
 * @param max               - The maximum percentage of the width of the panel.
 * @returns                 - The width of the panel, the ref to the container element, and the onMouseDown handler.
 */
export function useResizablePanel(
  initialPercentage = 25,
  {
    min = 15,
    max = 60,
  }: {
    min?: number
    max?: number
  } = {},
) {
  const [width, setWidth] = useState(initialPercentage)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = width

      // Use requestAnimationFrame to throttle state updates and avoid excessive re-renders
      const animationFrameIdRef = { current: null as number | null }

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (animationFrameIdRef.current !== null) return

        animationFrameIdRef.current = requestAnimationFrame(() => {
          animationFrameIdRef.current = null

          if (!containerRef.current) return
          const containerWidth = containerRef.current.clientWidth
          if (containerWidth === 0) return

          const deltaX = moveEvent.clientX - startX
          const deltaPercent = (deltaX / containerWidth) * 100
          const nextWidth = Math.min(Math.max(startWidth + deltaPercent, min), max)
          setWidth(nextWidth)
        })
      }

      const removeListeners = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', removeListeners)

        if (animationFrameIdRef.current !== null) {
          cancelAnimationFrame(animationFrameIdRef.current)
          animationFrameIdRef.current = null
        }
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', removeListeners)
    },
    [width, min, max],
  )

  return { width, containerRef, onMouseDown }
}
