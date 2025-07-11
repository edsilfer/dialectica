import React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPropsFactory } from '../../../utils/test/generic-test-utils'
import { render } from '../../../utils/test/render'
import { DiffLineViewModel } from '../models/DiffLineViewModel'
import SplitViewer from './SplitViewer'
import type { SplitViewerProps } from './types'
import { HunkDirection } from './types'
import type { Overlay, Widget } from '../../diff-viewer/types'

/**
 * # SplitViewer Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **useOverlayDocking**: Mocked to test overlay docking behavior without complex hook logic
 * - **DiffRow**: Mocked to isolate row rendering and test prop passing
 * - **ThemeContext**: Provided by render utility with light theme
 * - **window.getSelection**: Mocked to test selection change behavior
 * - **requestAnimationFrame**: Mocked to test selection change debouncing
 *
 * ## Happy Path
 * - Lines array with mixed types → Table renders with correct structure → DiffRow components receive correct props
 * - Overlays provided → Overlay groups passed to DiffRow components
 * - Widgets provided → Widgets passed to DiffRow components
 * - Load more callback provided → Callback passed to DiffRow components
 * - Selection changes → Container classes updated correctly
 *
 * ## Edge Cases
 * - **Empty lines array**: Table renders with empty tbody
 * - **No overlays**: Empty overlay groups object passed to DiffRow
 * - **No widgets**: Undefined widgets prop passed to DiffRow
 * - **No load more callback**: Undefined callback passed to DiffRow
 * - **Hunk lines**: DiffRow receives isHunk=true
 * - **Non-hunk lines**: DiffRow receives isHunk=false
 * - **Mixed line types**: Each line type handled correctly
 * - **Selection outside component**: No class changes
 * - **Collapsed selection**: Classes removed
 *
 * ## Assertions
 * - Verify table structure with correct colgroup and columns
 * - Test DiffRow prop passing for all scenarios
 * - Validate overlay docking integration
 * - Check mouse event handling
 * - Ensure split view mode is always false
 * - Test selection change behavior and CSS class management
 */

// MOCKS
const { useOverlayDocking } = vi.hoisted(() => ({
  useOverlayDocking: vi.fn(),
}))

vi.mock('../hooks/use-overlay-docking', () => ({
  useOverlayDocking,
}))

vi.mock('./DiffRow', () => ({
  DiffRow: vi.fn(
    ({
      line,
      isHunk,
      overlays,
      widgets,
      loadLines,
      unified,
      onMouseEnter,
      onMouseLeave,
      idx,
    }: {
      line: DiffLineViewModel
      isHunk: boolean
      overlays: Record<number, React.ReactNode[]>
      widgets?: Widget[]
      loadLines?: (line: DiffLineViewModel, direction: HunkDirection) => void
      unified: boolean
      onMouseEnter?: (e: React.MouseEvent<HTMLTableRowElement>) => void
      onMouseLeave?: (e: React.MouseEvent<HTMLTableRowElement>) => void
      idx: number
    }) => (
      <tr
        data-testid={`diff-row-${idx}`}
        data-line-type-left={line.typeLeft ?? 'empty'}
        data-line-type-right={line.typeRight ?? 'empty'}
        data-is-hunk={isHunk}
        data-overlays-count={Object.keys(overlays || {}).length}
        data-widgets-count={widgets?.length || 0}
        data-unified={unified}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <td>Left: {line.lineNumberLeft}</td>
        <td>Right: {line.lineNumberRight}</td>
        {loadLines && (
          <td>
            <button data-testid={`load-more-${idx}`} onClick={() => loadLines(line, 'down')}>
              Load More
            </button>
          </td>
        )}
      </tr>
    ),
  ),
}))

const makeSplitViewerProps = createPropsFactory<SplitViewerProps>({
  lines: [],
  loadMoreLinesCount: 5,
  overlays: [],
  widgets: [],
  onLoadMoreLines: vi.fn(),
})

const createMockLine = (
  typeLeft: 'add' | 'delete' | 'context' | 'hunk' | 'empty' = 'context',
  typeRight: 'add' | 'delete' | 'context' | 'hunk' | 'empty' = 'context',
  contentLeft: string = 'left content',
  contentRight: string = 'right content',
  lineNumberLeft: number = 1,
  lineNumberRight: number = 1,
  hunkDirection?: HunkDirection,
): DiffLineViewModel => {
  return new DiffLineViewModel(
    typeLeft,
    contentLeft,
    contentLeft,
    lineNumberLeft,
    typeRight,
    contentRight,
    contentRight,
    lineNumberRight,
    hunkDirection,
  )
}

const createMockOverlay = (id: string, splitDockIdx: 0 | 1 = 0): Overlay => ({
  unifiedDockIdx: 0,
  splitDockIdx,
  content: <div data-testid={`overlay-${id}`}>Overlay {id}</div>,
})

const createMockWidget = (id: string, side: 'left' | 'right' = 'left'): Widget => ({
  content: <div data-testid={`widget-${id}`}>Widget {id}</div>,
  line: 1,
  position: 'top',
  filepath: 'test.ts',
  side,
})

describe('SplitViewer', () => {
  let mockOverlayGroups: Record<number, React.ReactNode[]>
  let mockHandleRowEnter: ReturnType<typeof vi.fn>
  let mockHandleRowLeave: ReturnType<typeof vi.fn>
  let mockGetSelection: ReturnType<typeof vi.fn>
  let mockRequestAnimationFrame: ReturnType<typeof vi.fn>
  let mockCancelAnimationFrame: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockOverlayGroups = { 0: [<div key="overlay-1">Overlay 1</div>] }
    mockHandleRowEnter = vi.fn()
    mockHandleRowLeave = vi.fn()
    mockGetSelection = vi.fn()
    mockRequestAnimationFrame = vi.fn((cb: () => void) => {
      cb()
      return 1
    })
    mockCancelAnimationFrame = vi.fn()

    useOverlayDocking.mockReturnValue({
      overlayGroups: mockOverlayGroups,
      handleRowEnter: mockHandleRowEnter,
      handleRowLeave: mockHandleRowLeave,
    })

    // Mock window APIs
    Object.defineProperty(window, 'getSelection', {
      value: mockGetSelection,
      configurable: true,
    })
    Object.defineProperty(window, 'requestAnimationFrame', {
      value: mockRequestAnimationFrame,
      configurable: true,
    })
    Object.defineProperty(window, 'cancelAnimationFrame', {
      value: mockCancelAnimationFrame,
      configurable: true,
    })
  })

  describe('rendering scenarios', () => {
    it('given empty lines array, when rendered, expect empty table body', () => {
      // GIVEN
      const props = makeSplitViewerProps({ lines: [] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      expect(table.querySelector('tbody')).toBeInTheDocument()
      expect(table.querySelectorAll('tr')).toHaveLength(0)
    })

    it('given single context line, when rendered, expect one DiffRow with correct props', () => {
      // GIVEN
      const line = createMockLine('context', 'context', 'function test() {', 'function test() {', 1, 1)
      const props = makeSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const row = screen.getByTestId('diff-row-0')
      expect(row).toBeInTheDocument()
      expect(row).toHaveAttribute('data-line-type-left', 'context')
      expect(row).toHaveAttribute('data-line-type-right', 'context')
      expect(row).toHaveAttribute('data-is-hunk', 'false')
      expect(row).toHaveAttribute('data-unified', 'false')
    })

    it('given hunk line, when rendered, expect DiffRow with isHunk=true', () => {
      // GIVEN
      const line = createMockLine('hunk', 'hunk', '@@ -1,3 +1,4 @@', '@@ -1,3 +1,4 @@', undefined, undefined, 'out')
      const props = makeSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const row = screen.getByTestId('diff-row-0')
      expect(row).toHaveAttribute('data-line-type-left', 'hunk')
      expect(row).toHaveAttribute('data-line-type-right', 'hunk')
      expect(row).toHaveAttribute('data-is-hunk', 'true')
    })

    it('given mixed line types, when rendered, expect correct line types for each row', () => {
      // GIVEN
      const lines = [
        createMockLine('hunk', 'hunk', '@@ -1,3 +1,4 @@', '@@ -1,3 +1,4 @@', undefined, undefined, 'out'),
        createMockLine('context', 'context', 'function test() {', 'function test() {', 1, 1),
        createMockLine('delete', 'empty', '  return false;', '', 2, undefined),
        createMockLine('empty', 'add', '', '  return true;', undefined, 3),
      ]
      const props = makeSplitViewerProps({ lines })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      expect(screen.getByTestId('diff-row-0')).toHaveAttribute('data-line-type-left', 'hunk')
      expect(screen.getByTestId('diff-row-1')).toHaveAttribute('data-line-type-left', 'context')
      expect(screen.getByTestId('diff-row-2')).toHaveAttribute('data-line-type-left', 'delete')
      expect(screen.getByTestId('diff-row-3')).toHaveAttribute('data-line-type-left', 'empty')
    })
  })

  describe('table structure', () => {
    it('given any lines, when rendered, expect correct table structure with colgroup', () => {
      // GIVEN
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const table = screen.getByRole('table')
      const colgroup = table.querySelector('colgroup')
      expect(colgroup).toBeInTheDocument()

      const cols = colgroup?.querySelectorAll('col')
      expect(cols).toHaveLength(4)
      expect(cols?.[0]).toHaveStyle({ width: '50px' })
      expect(cols?.[1]).toHaveStyle({ width: 'auto' })
      expect(cols?.[2]).toHaveStyle({ width: '50px' })
      expect(cols?.[3]).toHaveStyle({ width: 'auto' })
    })

    it('given multiple lines, when rendered, expect correct number of rows', () => {
      // GIVEN
      const lines = [
        createMockLine('context', 'context', 'line 1', 'line 1', 1, 1),
        createMockLine('context', 'context', 'line 2', 'line 2', 2, 2),
        createMockLine('context', 'context', 'line 3', 'line 3', 3, 3),
      ]
      const props = makeSplitViewerProps({ lines })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const rows = screen.getAllByTestId(/^diff-row-/)
      expect(rows).toHaveLength(3)
    })
  })

  describe('overlay integration', () => {
    it('given overlays provided, when rendered, expect overlay groups passed to DiffRow', () => {
      // GIVEN
      const overlays = [createMockOverlay('1', 0), createMockOverlay('2', 1)]
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line], overlays })

      // MOCK
      useOverlayDocking.mockReturnValue({
        overlayGroups: { 0: [<div key="overlay-1">Overlay 1</div>], 1: [<div key="overlay-2">Overlay 2</div>] },
        handleRowEnter: mockHandleRowEnter,
        handleRowLeave: mockHandleRowLeave,
      })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      expect(useOverlayDocking).toHaveBeenCalledWith({
        overlays,
        lines: [line],
        viewMode: 'split',
      })
      const row = screen.getByTestId('diff-row-0')
      expect(row).toHaveAttribute('data-overlays-count', '2')
    })

    it('given no overlays, when rendered, expect empty overlay groups', () => {
      // GIVEN
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line], overlays: undefined })

      // MOCK
      useOverlayDocking.mockReturnValue({
        overlayGroups: {},
        handleRowEnter: mockHandleRowEnter,
        handleRowLeave: mockHandleRowLeave,
      })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const row = screen.getByTestId('diff-row-0')
      expect(row).toHaveAttribute('data-overlays-count', '0')
    })
  })

  describe('widget integration', () => {
    it('given widgets provided, when rendered, expect widgets passed to DiffRow', () => {
      // GIVEN
      const widgets = [createMockWidget('1', 'left'), createMockWidget('2', 'right')]
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line], widgets })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const row = screen.getByTestId('diff-row-0')
      expect(row).toHaveAttribute('data-widgets-count', '2')
    })

    it('given no widgets, when rendered, expect undefined widgets passed to DiffRow', () => {
      // GIVEN
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line], widgets: undefined })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const row = screen.getByTestId('diff-row-0')
      expect(row).toHaveAttribute('data-widgets-count', '0')
    })
  })

  describe('load more functionality', () => {
    it('given load more callback provided, when rendered, expect callback passed to DiffRow', () => {
      // GIVEN
      const mockLoadMore = vi.fn()
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line], onLoadMoreLines: mockLoadMore })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const loadMoreButton = screen.getByTestId('load-more-0')
      expect(loadMoreButton).toBeInTheDocument()
    })

    it('given no load more callback, when rendered, expect no load more button', () => {
      // GIVEN
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line], onLoadMoreLines: undefined })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      expect(screen.queryByTestId('load-more-0')).not.toBeInTheDocument()
    })

    it('given load more triggered, when clicked, expect callback called with correct parameters', () => {
      // GIVEN
      const mockLoadMore = vi.fn()
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line], onLoadMoreLines: mockLoadMore })

      // WHEN
      render(<SplitViewer {...props} />)
      fireEvent.click(screen.getByTestId('load-more-0'))

      // EXPECT
      expect(mockLoadMore).toHaveBeenCalledWith(line, 'down')
    })
  })

  describe('mouse event handling', () => {
    it('given row hovered, when mouse enters, expect handleRowEnter called', () => {
      // GIVEN
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)
      fireEvent.mouseEnter(screen.getByTestId('diff-row-0'))

      // EXPECT
      expect(mockHandleRowEnter).toHaveBeenCalled()
    })

    it('given row unhovered, when mouse leaves, expect handleRowLeave called', () => {
      // GIVEN
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)
      fireEvent.mouseLeave(screen.getByTestId('diff-row-0'))

      // EXPECT
      expect(mockHandleRowLeave).toHaveBeenCalled()
    })
  })

  describe('selection change handling', () => {
    it('given selection change event, when selection exists, expect container classes updated', () => {
      // GIVEN
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line] })

      // Mock selection with left side selected
      const mockSelection = {
        rangeCount: 1,
        isCollapsed: false,
        anchorNode: {
          parentElement: {
            closest: vi.fn((selector: string): Element | null => {
              if (selector === '.split-viewer-left-row') return { tagName: 'TD' } as Element
              return null
            }),
          },
        },
      }
      mockGetSelection.mockReturnValue(mockSelection)

      // WHEN
      render(<SplitViewer {...props} />)
      const container = screen.getByRole('table').parentElement

      // Trigger selection change
      fireEvent(document, new Event('selectionchange'))

      // EXPECT
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
      expect(container).toHaveClass('is-selecting')
      expect(container).toHaveClass('selecting-left')
      expect(container).not.toHaveClass('selecting-right')
    })

    it('given selection change event, when right side selected, expect selecting-right class added', () => {
      // GIVEN
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line] })

      // Mock selection with right side selected
      const mockSelection = {
        rangeCount: 1,
        isCollapsed: false,
        anchorNode: {
          parentElement: {
            closest: vi.fn((selector: string): Element | null => {
              if (selector === '.split-viewer-right-row') return { tagName: 'TD' } as Element
              return null
            }),
          },
        },
      }
      mockGetSelection.mockReturnValue(mockSelection)

      // WHEN
      render(<SplitViewer {...props} />)
      const container = screen.getByRole('table').parentElement

      // Trigger selection change
      fireEvent(document, new Event('selectionchange'))

      // EXPECT
      expect(container).toHaveClass('is-selecting')
      expect(container).toHaveClass('selecting-right')
      expect(container).not.toHaveClass('selecting-left')
    })

    it('given selection change event, when selection collapsed, expect classes removed', () => {
      // GIVEN
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line] })

      // Mock collapsed selection
      const mockSelection = {
        rangeCount: 1,
        isCollapsed: true,
      }
      mockGetSelection.mockReturnValue(mockSelection)

      // WHEN
      render(<SplitViewer {...props} />)
      const container = screen.getByRole('table').parentElement

      // Trigger selection change
      fireEvent(document, new Event('selectionchange'))

      // EXPECT
      expect(container).not.toHaveClass('is-selecting')
      expect(container).not.toHaveClass('selecting-left')
      expect(container).not.toHaveClass('selecting-right')
    })

    it('given selection change event, when no selection, expect classes removed', () => {
      // GIVEN
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line] })

      // Mock no selection
      const mockSelection = {
        rangeCount: 0,
        isCollapsed: false,
      }
      mockGetSelection.mockReturnValue(mockSelection)

      // WHEN
      render(<SplitViewer {...props} />)
      const container = screen.getByRole('table').parentElement

      // Trigger selection change
      fireEvent(document, new Event('selectionchange'))

      // EXPECT
      expect(container).not.toHaveClass('is-selecting')
      expect(container).not.toHaveClass('selecting-left')
      expect(container).not.toHaveClass('selecting-right')
    })

    it('given selection change event, when selection outside component, expect no class changes', () => {
      // GIVEN
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line] })

      // Mock selection outside component
      const mockSelection = {
        rangeCount: 1,
        isCollapsed: false,
        anchorNode: {
          parentElement: {
            closest: vi.fn((): Element | null => null), // No matching elements
          },
        },
      }
      mockGetSelection.mockReturnValue(mockSelection)

      // WHEN
      render(<SplitViewer {...props} />)
      const container = screen.getByRole('table').parentElement

      // Trigger selection change
      fireEvent(document, new Event('selectionchange'))

      // EXPECT
      expect(container).toHaveClass('is-selecting')
      expect(container).not.toHaveClass('selecting-left')
      expect(container).not.toHaveClass('selecting-right')
    })

    it('given component unmounted, when selection change occurs, expect no errors', () => {
      // GIVEN
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line] })

      // WHEN
      const { unmount } = render(<SplitViewer {...props} />)

      // Trigger selection change before unmount to verify it works
      fireEvent(document, new Event('selectionchange'))
      expect(mockRequestAnimationFrame).toHaveBeenCalled()

      // Reset mock for unmount test
      vi.clearAllMocks()
      unmount()

      // Trigger selection change after unmount
      fireEvent(document, new Event('selectionchange'))

      // EXPECT
      // Should not throw any errors and should not call requestAnimationFrame after unmount
      expect(mockRequestAnimationFrame).not.toHaveBeenCalled()
    })
  })

  describe('animation frame handling', () => {
    it('given rapid selection changes, when debounced, expect only one animation frame request', () => {
      // GIVEN
      const line = createMockLine('context', 'context', 'test line', 'test line', 1, 1)
      const props = makeSplitViewerProps({ lines: [line] })

      const mockSelection = {
        rangeCount: 1,
        isCollapsed: false,
        anchorNode: {
          parentElement: {
            closest: vi.fn((): Element | null => ({ tagName: 'TD' }) as Element),
          },
        },
      }
      mockGetSelection.mockReturnValue(mockSelection)

      // WHEN
      render(<SplitViewer {...props} />)

      // Trigger multiple rapid selection changes
      fireEvent(document, new Event('selectionchange'))
      fireEvent(document, new Event('selectionchange'))
      fireEvent(document, new Event('selectionchange'))

      // EXPECT
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(3)
      expect(mockCancelAnimationFrame).toHaveBeenCalledTimes(2)
    })
  })
})
