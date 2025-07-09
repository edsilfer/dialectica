import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import {
  createPropsFactory,
  mockElementProperty,
  expectElementToHaveTextContent,
} from '../../../utils/test/generic-test-utils'
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

// ====================
// TEST UTILITIES
// ====================
interface HarnessProps {
  initial?: number
  min?: number
  max?: number
}

const createHarnessProps = createPropsFactory<HarnessProps>({
  initial: 25,
  min: 15,
  max: 60,
})

function Harness({ initial = 25, min = 15, max = 60 }: HarnessProps) {
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

const setupContainerMock = (clientWidth: number): HTMLElement => {
  const container = screen.getByTestId('container')
  mockElementProperty(container, 'clientWidth', clientWidth)
  return container
}

const performDragOperation = (startX: number, endX: number): void => {
  const handle = screen.getByTestId('handle')

  fireEvent.mouseDown(handle, { clientX: startX })
  fireEvent.mouseMove(document, { clientX: endX })
  fireEvent.mouseUp(document)
}

const expectWidthToBe = (expectedWidth: string): void => {
  expectElementToHaveTextContent('width', expectedWidth)
}

// ====================
// TEST CASES
// ====================
describe('useResizablePanel', () => {
  beforeEach(() => {
    // Reset all mocks/spies between tests to avoid cross-test pollution
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('given default initial value, when rendered, expect default width displayed', () => {
      // GIVEN
      const props = createHarnessProps()

      // WHEN
      render(<Harness {...props} />)

      // EXPECT
      expectWidthToBe('25')
    })

    it('given custom initial value, when rendered, expect custom width displayed', () => {
      // GIVEN
      const props = createHarnessProps({ initial: 30 })

      // WHEN
      render(<Harness {...props} />)

      // EXPECT
      expectWidthToBe('30')
    })
  })

  describe('mouse drag interactions', () => {
    it('given normal drag operation, when dragged, expect width to update correctly', () => {
      // GIVEN
      const props = createHarnessProps()
      render(<Harness {...props} />)
      setupContainerMock(200) // 200px wide container

      // WHEN - Drag from x=0 to x=50 (25% of 200px = 25 percentage points)
      performDragOperation(0, 50)

      // EXPECT - Width starts at 25 and adds 25 percentage points → 50
      expectWidthToBe('50')
    })

    it('given drag beyond maximum, when dragged, expect width clamped to maximum', () => {
      // GIVEN
      const props = createHarnessProps({ max: 60 })
      render(<Harness {...props} />)
      setupContainerMock(200)

      // WHEN - Move the mouse far enough to exceed the max (e.g. +300px ⇒ +150%)
      performDragOperation(0, 300)

      // EXPECT - Should be clamped to maximum
      expectWidthToBe('60')
    })

    it('given drag below minimum, when dragged, expect width clamped to minimum', () => {
      // GIVEN
      const props = createHarnessProps({ min: 15 })
      render(<Harness {...props} />)
      setupContainerMock(200)

      // WHEN - Drag far to the left (negative delta)
      performDragOperation(100, -200)

      // EXPECT - Should be clamped to minimum
      expectWidthToBe('15')
    })
  })

  describe('edge cases', () => {
    it('given very small container, when dragged, expect proportional scaling', () => {
      // GIVEN
      const props = createHarnessProps()
      render(<Harness {...props} />)
      setupContainerMock(100) // Small container

      // WHEN - 25px movement in 100px container = 25%
      performDragOperation(0, 25)

      // EXPECT - 25 (initial) + 25 (drag) = 50
      expectWidthToBe('50')
    })

    it('given large container, when dragged, expect proportional scaling', () => {
      // GIVEN
      const props = createHarnessProps()
      render(<Harness {...props} />)
      setupContainerMock(400) // Large container

      // WHEN - 100px movement in 400px container = 25%
      performDragOperation(0, 100)

      // EXPECT - 25 (initial) + 25 (drag) = 50
      expectWidthToBe('50')
    })
  })

  describe('boundary conditions', () => {
    it('given width at maximum, when dragged further, expect no change beyond max', () => {
      // GIVEN
      const props = createHarnessProps({ initial: 60, max: 60 })
      render(<Harness {...props} />)
      setupContainerMock(200)

      // WHEN - Try to drag beyond current maximum
      performDragOperation(0, 100)

      // EXPECT - Should remain at maximum
      expectWidthToBe('60')
    })

    it('given width at minimum, when dragged lower, expect no change below min', () => {
      // GIVEN
      const props = createHarnessProps({ initial: 15, min: 15 })
      render(<Harness {...props} />)
      setupContainerMock(200)

      // WHEN - Try to drag below current minimum
      performDragOperation(0, -100)

      // EXPECT - Should remain at minimum
      expectWidthToBe('15')
    })
  })
})
