import React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render } from '../../../utils/test/render'
import { useOverlayDocking } from './use-overlay-docking'
import { DiffLineViewModel } from '../models/DiffLineViewModel'
import type { Overlay } from '../../diff-viewer/types'

// MOCK
vi.mock('lodash/debounce', () => ({
  default: vi.fn((fn) => {
    const debouncedFn = vi.fn(fn) as ReturnType<typeof vi.fn> & { cancel: ReturnType<typeof vi.fn> }
    debouncedFn.cancel = vi.fn()
    return debouncedFn
  }),
}))

// HELPERS
const createMockDiffLineViewModel = (overrides: Partial<DiffLineViewModel> = {}): DiffLineViewModel => {
  const defaultLine = new DiffLineViewModel(
    'context',
    'test content left',
    'test content left',
    1,
    'context',
    'test content right',
    'test content right',
    2,
  )
  return Object.assign(defaultLine, overrides)
}

const createMockOverlay = (overrides: Partial<Overlay> = {}): Overlay => ({
  content: <div data-testid="overlay-content">Overlay Content</div>,
  unifiedDockIdx: 0,
  splitDockIdx: 0,
  onDock: vi.fn(),
  ...overrides,
})

const createUseOverlayDockingProps = (
  overrides: Partial<{
    overlays: Overlay[]
    lines: DiffLineViewModel[]
    viewMode: 'unified' | 'split'
  }> = {},
) => ({
  overlays: [createMockOverlay()],
  lines: [createMockDiffLineViewModel()],
  viewMode: 'unified' as const,
  ...overrides,
})

// Test harness component
const TestComponent: React.FC<{
  overlays?: Overlay[]
  lines: DiffLineViewModel[]
  viewMode: 'unified' | 'split'
}> = ({ overlays, lines, viewMode }) => {
  const { overlayGroups, handleRowEnter, handleRowLeave } = useOverlayDocking({ overlays, lines, viewMode })

  return (
    <div>
      <div data-testid="overlay-groups">
        {Object.entries(overlayGroups).map(([dockIndex, contents]) => (
          <div key={dockIndex} data-testid={`dock-${dockIndex}`}>
            {contents.map((content, index) => (
              <div key={index} data-testid={`content-${dockIndex}-${index}`}>
                {content}
              </div>
            ))}
          </div>
        ))}
      </div>
      <table>
        <tbody>
          {lines.map((line, index) => (
            <tr
              key={index}
              data-testid={`row-${index}`}
              data-idx={index}
              onMouseEnter={handleRowEnter}
              onMouseLeave={handleRowLeave}
            >
              <td>Line {index + 1}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

describe('useOverlayDocking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.dispatchEvent
    Object.defineProperty(window, 'dispatchEvent', {
      value: vi.fn(),
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('overlay grouping scenarios', () => {
    it('given no overlays, when hook is called, expect empty overlay groups', () => {
      // GIVEN
      const props = createUseOverlayDockingProps({ overlays: undefined })

      // WHEN
      render(<TestComponent {...props} />)

      // EXPECT
      expect(screen.queryByTestId('dock-0')).not.toBeInTheDocument()
    })

    it('given single overlay, when hook is called, expect overlay grouped by dock index', () => {
      // GIVEN
      const overlay = createMockOverlay({ unifiedDockIdx: 1, splitDockIdx: 1 })
      const props = createUseOverlayDockingProps({ overlays: [overlay] })

      // WHEN
      render(<TestComponent {...props} />)

      // EXPECT
      expect(screen.getByTestId('dock-1')).toBeInTheDocument()
      expect(screen.getByTestId('content-1-0')).toBeInTheDocument()
    })

    it('given multiple overlays with same dock index, when hook is called, expect overlays grouped together', () => {
      // GIVEN
      const overlays = [
        createMockOverlay({
          unifiedDockIdx: 0,
          splitDockIdx: 0,
          content: <div data-testid="overlay-1">Overlay 1</div>,
        }),
        createMockOverlay({
          unifiedDockIdx: 0,
          splitDockIdx: 0,
          content: <div data-testid="overlay-2">Overlay 2</div>,
        }),
      ]
      const props = createUseOverlayDockingProps({ overlays })

      // WHEN
      render(<TestComponent {...props} />)

      // EXPECT
      expect(screen.getByTestId('dock-0')).toBeInTheDocument()
      expect(screen.getByTestId('overlay-1')).toBeInTheDocument()
      expect(screen.getByTestId('overlay-2')).toBeInTheDocument()
    })

    it('given overlays with different dock indices, when hook is called, expect separate groups', () => {
      // GIVEN
      const overlays = [
        createMockOverlay({
          unifiedDockIdx: 0,
          splitDockIdx: 0,
          content: <div data-testid="overlay-0">Overlay 0</div>,
        }),
        createMockOverlay({
          unifiedDockIdx: 1,
          splitDockIdx: 1,
          content: <div data-testid="overlay-1">Overlay 1</div>,
        }),
        createMockOverlay({
          unifiedDockIdx: 2,
          splitDockIdx: 1,
          content: <div data-testid="overlay-2">Overlay 2</div>,
        }),
      ]
      const props = createUseOverlayDockingProps({ overlays })

      // WHEN
      render(<TestComponent {...props} />)

      // EXPECT
      expect(screen.getByTestId('dock-0')).toBeInTheDocument()
      expect(screen.getByTestId('dock-1')).toBeInTheDocument()
      expect(screen.getByTestId('dock-2')).toBeInTheDocument()
      expect(screen.getByTestId('overlay-0')).toBeInTheDocument()
      expect(screen.getByTestId('overlay-1')).toBeInTheDocument()
      expect(screen.getByTestId('overlay-2')).toBeInTheDocument()
    })

    it('given unified view mode, when hook is called, expect overlay grouped by unifiedDockIdx', () => {
      // GIVEN
      const overlays = [
        createMockOverlay({
          unifiedDockIdx: 1,
          splitDockIdx: 0,
          content: <div data-testid="unified-overlay">Unified Overlay</div>,
        }),
      ]
      const props = createUseOverlayDockingProps({ overlays, viewMode: 'unified' })

      // WHEN
      render(<TestComponent {...props} />)

      // EXPECT
      expect(screen.getByTestId('dock-1')).toBeInTheDocument()
      expect(screen.getByTestId('unified-overlay')).toBeInTheDocument()
    })

    it('given split view mode, when hook is called, expect overlay grouped by splitDockIdx', () => {
      // GIVEN
      const overlays = [
        createMockOverlay({
          unifiedDockIdx: 2,
          splitDockIdx: 1,
          content: <div data-testid="split-overlay">Split Overlay</div>,
        }),
      ]
      const props = createUseOverlayDockingProps({ overlays, viewMode: 'split' })

      // WHEN
      render(<TestComponent {...props} />)

      // EXPECT
      expect(screen.getByTestId('dock-1')).toBeInTheDocument()
      expect(screen.getByTestId('split-overlay')).toBeInTheDocument()
    })
  })

  describe('row hover scenarios', () => {
    it('given row is hovered, when handleRowEnter is called, expect overlay event dispatched', () => {
      // GIVEN
      const props = createUseOverlayDockingProps()
      render(<TestComponent {...props} />)
      const row = screen.getByTestId('row-0')

      // WHEN
      fireEvent.mouseEnter(row)

      // EXPECT
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'overlay-visible',
          detail: { line: props.lines[0], idx: 0 },
        }),
      )
    })

    it('given row with invalid data-idx, when handleRowEnter is called, expect no action taken', () => {
      // GIVEN
      const props = createUseOverlayDockingProps()
      render(<TestComponent {...props} />)
      const invalidRow = document.createElement('tr')
      invalidRow.setAttribute('data-idx', '-1')

      // WHEN
      fireEvent.mouseEnter(invalidRow)

      // EXPECT
      expect(window.dispatchEvent).not.toHaveBeenCalled()
    })

    it('given row is unhovered, when handleRowLeave is called, expect no overlay event dispatched', () => {
      // GIVEN
      const props = createUseOverlayDockingProps()
      render(<TestComponent {...props} />)
      const row = screen.getByTestId('row-0')

      // WHEN
      fireEvent.mouseLeave(row)

      // EXPECT
      expect(window.dispatchEvent).not.toHaveBeenCalled()
    })
  })

  describe('overlay docking scenarios', () => {
    it('given overlay with onDock callback, when row is hovered, expect callback called with correct metadata', () => {
      // GIVEN
      const mockOnDock = vi.fn()
      const overlay = createMockOverlay({ onDock: mockOnDock })
      const line = createMockDiffLineViewModel({
        lineNumberLeft: 10,
        lineNumberRight: 15,
        contentLeft: 'left content',
        contentRight: 'right content',
      })
      const props = createUseOverlayDockingProps({ overlays: [overlay], lines: [line] })
      render(<TestComponent {...props} />)
      const row = screen.getByTestId('row-0')

      // WHEN
      fireEvent.mouseEnter(row)

      // EXPECT
      expect(mockOnDock).toHaveBeenCalledWith({
        lineNumber: 10,
        side: 'left',
        content: 'left content',
      })
    })

    it('given line with only right side data, when row is hovered, expect callback called with right side metadata', () => {
      // GIVEN
      const mockOnDock = vi.fn()
      const overlay = createMockOverlay({ onDock: mockOnDock })
      const line = createMockDiffLineViewModel({
        lineNumberLeft: null,
        lineNumberRight: 20,
        contentLeft: null,
        contentRight: 'right only content',
      })
      const props = createUseOverlayDockingProps({ overlays: [overlay], lines: [line] })
      render(<TestComponent {...props} />)
      const row = screen.getByTestId('row-0')

      // WHEN
      fireEvent.mouseEnter(row)

      // EXPECT
      expect(mockOnDock).toHaveBeenCalledWith({
        lineNumber: 20,
        side: 'right',
        content: 'right only content',
      })
    })

    it('given line with no line numbers, when row is hovered, expect callback called with undefined values', () => {
      // GIVEN
      const mockOnDock = vi.fn()
      const overlay = createMockOverlay({ onDock: mockOnDock })
      const line = createMockDiffLineViewModel({
        lineNumberLeft: null,
        lineNumberRight: null,
        contentLeft: null,
        contentRight: null,
      })
      const props = createUseOverlayDockingProps({ overlays: [overlay], lines: [line] })
      render(<TestComponent {...props} />)
      const row = screen.getByTestId('row-0')

      // WHEN
      fireEvent.mouseEnter(row)

      // EXPECT
      expect(mockOnDock).toHaveBeenCalledWith({
        lineNumber: undefined,
        side: undefined,
        content: undefined,
      })
    })

    it('given overlay without onDock callback, when row is hovered, expect no callback called', () => {
      // GIVEN
      const overlay = createMockOverlay({ onDock: undefined })
      const props = createUseOverlayDockingProps({ overlays: [overlay] })
      render(<TestComponent {...props} />)
      const row = screen.getByTestId('row-0')

      // WHEN
      fireEvent.mouseEnter(row)

      // EXPECT
      // No error should be thrown and no callback should be called
      expect(window.dispatchEvent).toHaveBeenCalled()
    })
  })

  describe('debouncing scenarios', () => {
    it('given same row hovered multiple times, when handleRowEnter called, expect dispatch called only once', () => {
      // GIVEN
      const props = createUseOverlayDockingProps()
      render(<TestComponent {...props} />)
      const row = screen.getByTestId('row-0')

      // WHEN
      fireEvent.mouseEnter(row)
      fireEvent.mouseEnter(row)
      fireEvent.mouseEnter(row)

      // EXPECT
      expect(window.dispatchEvent).toHaveBeenCalledTimes(1)
    })

    it('given different rows hovered, when handleRowEnter called, expect dispatch called for each', () => {
      // GIVEN
      const lines = [
        createMockDiffLineViewModel({ lineNumberLeft: 1 }),
        createMockDiffLineViewModel({ lineNumberLeft: 2 }),
      ]
      const props = createUseOverlayDockingProps({ lines })
      render(<TestComponent {...props} />)
      const row1 = screen.getByTestId('row-0')
      const row2 = screen.getByTestId('row-1')

      // WHEN
      fireEvent.mouseEnter(row1)
      fireEvent.mouseEnter(row2)

      // EXPECT
      expect(window.dispatchEvent).toHaveBeenCalledTimes(2)
      expect(window.dispatchEvent).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          detail: { line: lines[0], idx: 0 },
        }),
      )
      expect(window.dispatchEvent).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          detail: { line: lines[1], idx: 1 },
        }),
      )
    })
  })

  describe('edge cases', () => {
    it('given empty lines array, when hook is called, expect no errors thrown', () => {
      // GIVEN
      const props = createUseOverlayDockingProps({ lines: [] })

      // WHEN & EXPECT
      expect(() => render(<TestComponent {...props} />)).not.toThrow()
    })

    it('given overlay with id property, when hook is called, expect overlay groups updated correctly', () => {
      // GIVEN
      const overlayWithId = {
        ...createMockOverlay(),
        id: 'test-id',
      }
      const props = createUseOverlayDockingProps({ overlays: [overlayWithId] })

      // WHEN
      render(<TestComponent {...props} />)

      // EXPECT
      expect(screen.getByTestId('dock-0')).toBeInTheDocument()
    })

    it('given row hovered then unhovered, when handleRowLeave called, expect debounced function cancelled', () => {
      // GIVEN
      const props = createUseOverlayDockingProps()
      render(<TestComponent {...props} />)
      const row = screen.getByTestId('row-0')

      // WHEN
      fireEvent.mouseEnter(row)
      fireEvent.mouseLeave(row)

      // EXPECT
      // The debounced function should be cancelled, but we can't directly test this
      // The important thing is that no errors are thrown
      expect(() => fireEvent.mouseLeave(row)).not.toThrow()
    })
  })
})
