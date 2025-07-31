import React, { useCallback, useEffect, useRef, useState } from 'react'

const FRAME_MS = 16

type DragState = {
  /** The last update time. */
  lastUpdate: number
  /** Whether the RAF is queued. */
  rafQueued: boolean
  /** The start X position. */
  startX: number
  /** The start width. */
  startWidth: number
}

/**
 * Adds horizontal-resize behaviour to side-panels.
 *
 * @param props.initial - Initial width in % (default 25).
 * @param props.min     - Minimum width in % (default 15).
 * @param props.max     - Maximum width in % (default 60).
 *
 * @returns - {
 *  width       : Current width in %.
 *  containerRef: Attach to the resizable element.
 *  onMouseDown : Attach to the resize handle.
 *  dragging    : Whether the user is dragging.
 * }
 */
export function useResizablePanel(
  props: {
    initial?: number
    min?: number
    max?: number
  } = {},
) {
  const { initial = 30, min: rawMin = 15, max: rawMax = 60 } = props
  const minPct = Math.min(rawMin, rawMax)
  const maxPct = rawMax

  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(clamp(initial, minPct, maxPct))
  const [dragging, setDragging] = useState(false)

  const minRef = useSyncedRef(minPct)
  const maxRef = useSyncedRef(maxPct)

  const dragState = useRef<DragState>({
    lastUpdate: 0,
    rafQueued: false,
    startX: 0,
    startWidth: 0,
  })

  /* Re-clamp current width whenever bounds change */
  useEffect(() => {
    setWidth((prev) => clamp(prev, minRef.current, maxRef.current))
    dragState.current.startWidth = clamp(dragState.current.startWidth, minRef.current, maxRef.current)
  }, [minPct, maxPct, minRef, maxRef])

  /* Clean up any stray global listeners */
  useGlobalMouseCleanup()

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragging(true)

      dragState.current = {
        lastUpdate: 0,
        rafQueued: false,
        startX: e.clientX,
        startWidth: width,
      }

      const move = (mv: MouseEvent) =>
        scheduleResize(mv, containerRef, dragState, minRef.current, maxRef.current, setWidth)

      const up = () => {
        removeListeners(move, up)
        setDragging(false)
      }

      addListeners(move, up)
    },
    [width, minRef, maxRef],
  )

  return { containerRef, width, dragging, setWidth, onMouseDown }
}

/**
 * clamp
 *
 * Constrains a value between the provided bounds.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Schedules a resize.
 *
 * @param ev           - The mouse event.
 * @param containerRef - The container ref.
 * @param dragState    - The drag state.
 * @param minPct       - The minimum percentage.
 * @param maxPct       - The maximum percentage.
 * @param setWidth     - The function to set the width.
 */
function scheduleResize(
  ev: MouseEvent,
  containerRef: React.RefObject<HTMLDivElement | null>,
  dragState: React.RefObject<DragState>,
  minPct: number,
  maxPct: number,
  setWidth: React.Dispatch<React.SetStateAction<number>>,
) {
  const now = performance.now()
  if (dragState.current.rafQueued || now - dragState.current.lastUpdate < FRAME_MS) return

  dragState.current.rafQueued = true
  dragState.current.lastUpdate = now

  requestAnimationFrame(() => {
    dragState.current.rafQueued = false

    const container = containerRef.current
    if (!container) return
    const containerWidth = container.clientWidth
    if (containerWidth === 0) return

    const deltaX = ev.clientX - dragState.current.startX
    const deltaPct = (deltaX / containerWidth) * 100
    const next = clamp(dragState.current.startWidth + deltaPct, minPct, maxPct)

    /* Threshold ≈ 1 px */
    const thresholdPct = (1 / containerWidth) * 100
    setWidth((prev) => (Math.abs(next - prev) > thresholdPct ? next : prev))
  })
}

/**
 * Keeps a ref synced with the latest value.
 *
 * @param value - The value to sync.
 * @returns - The synced ref.
 */
function useSyncedRef<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

/**
 * Ensures global mouse listeners are cleared on unmount.
 */
function useGlobalMouseCleanup() {
  useEffect(() => {
    return () => removeListeners()
  }, [])
}

/**
 * Adds the mouse move and mouse up listeners.
 *
 * @param move - The mouse move listener.
 * @param up   - The mouse up listener.
 */
function addListeners(move?: (e: MouseEvent) => void, up?: (e: MouseEvent) => void) {
  if (move) document.addEventListener('mousemove', move)
  if (up) document.addEventListener('mouseup', up)
  mouseMoveListener = move ?? mouseMoveListener
  mouseUpListener = up ?? mouseUpListener
}

/**
 * Removes the mouse move and mouse up listeners.
 *
 * @param move - The mouse move listener.
 * @param up   - The mouse up listener.
 */
function removeListeners(move?: (e: MouseEvent) => void, up?: (e: MouseEvent) => void) {
  document.removeEventListener('mousemove', move ?? mouseMoveListener ?? noop)
  document.removeEventListener('mouseup', up ?? mouseUpListener ?? noop)
  mouseMoveListener = null
  mouseUpListener = null
}

function noop() {}

let mouseMoveListener: ((e: MouseEvent) => void) | null = null
let mouseUpListener: ((e: MouseEvent) => void) | null = null
