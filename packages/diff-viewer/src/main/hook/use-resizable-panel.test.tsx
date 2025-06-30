import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useResizablePanel } from './use-resizable-panel'

/*
 * JSDOM does not provide requestAnimationFrame. For the purposes of these tests we
 * stub it so the callback executes immediately, making the hook's asynchronous
 * updates synchronous and therefore easier to assert against.
 */
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  cb(0)
  return 0
})
vi.stubGlobal('cancelAnimationFrame', () => {})

function Harness({ initial = 25, min = 15, max = 60 }: { initial?: number; min?: number; max?: number }) {
  const { width, containerRef, onMouseDown } = useResizablePanel(initial, {
    min,
    max,
  })

  return (
    <div ref={containerRef} data-testid="container">
      {/* Expose the current width to the test via text content */}
      <span data-testid="width">{width}</span>
      {/* The handle onto which the mouse events are bound */}
      <div data-testid="handle" onMouseDown={onMouseDown} />
    </div>
  )
}

describe('useResizablePanel', () => {
  beforeEach(() => {
    // Reset all mocks/spies between tests to avoid cross-test pollution
    vi.clearAllMocks()
  })

  it('returns the initial width', () => {
    render(<Harness initial={30} />)
    expect(screen.getByTestId('width').textContent).toBe('30')
  })

  it('updates the width based on mouse movement', () => {
    render(<Harness />)

    const container = screen.getByTestId('container')
    // Pretend that the container is 200px wide so that 50px mouse movement
    // corresponds to 25% (i.e. 50 / 200 * 100)
    Object.defineProperty(container, 'clientWidth', {
      configurable: true,
      get: () => 200,
    })

    const handle = screen.getByTestId('handle')

    // User presses the mouse on the handle at x = 0 …
    fireEvent.mouseDown(handle, { clientX: 0 })
    // … drags it to x = 50 …
    fireEvent.mouseMove(document, { clientX: 50 })
    // … and releases it.
    fireEvent.mouseUp(document)

    // Width starts at 25 and the drag adds 25 percentage points → 50
    expect(screen.getByTestId('width').textContent).toBe('50')
  })

  it('does not allow the width to exceed the configured maximum', () => {
    render(<Harness />)

    const container = screen.getByTestId('container')
    Object.defineProperty(container, 'clientWidth', {
      configurable: true,
      get: () => 200,
    })

    const handle = screen.getByTestId('handle')

    fireEvent.mouseDown(handle, { clientX: 0 })
    // Move the mouse far enough to exceed the max (e.g. +300px ⇒ +150%)
    fireEvent.mouseMove(document, { clientX: 300 })
    fireEvent.mouseUp(document)

    expect(screen.getByTestId('width').textContent).toBe('60') // max
  })

  it('does not allow the width to fall below the configured minimum', () => {
    render(<Harness />)

    const container = screen.getByTestId('container')
    Object.defineProperty(container, 'clientWidth', {
      configurable: true,
      get: () => 200,
    })

    const handle = screen.getByTestId('handle')

    fireEvent.mouseDown(handle, { clientX: 100 })
    // Drag far to the left (negative delta)
    fireEvent.mouseMove(document, { clientX: -200 })
    fireEvent.mouseUp(document)

    expect(screen.getByTestId('width').textContent).toBe('15') // min
  })
})
