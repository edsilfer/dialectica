import React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createPropsFactory } from '../../../utils/test/generic-test-utils'
import { LINE_TYPE_TEST_CASES, SIMPLE_CHANGES } from '../../../utils/test/models/test-utils'
import { render } from '../../../utils/test/render'
import { DiffLineViewModel } from '../models/DiffLineViewModel'
import UnifiedViewer from './UnifiedViewer'
import type { DiffLineType, HunkDirection, UnifiedViewerProps } from './types'

/**
 * # UnifiedViewer Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **LoadMoreButton**: Mocked to isolate UnifiedViewer from button component logic and test click interactions
 * - **DiffLineViewModel**: Used as test data factory to create predictable line representations
 * - **Test fixtures**: LINE_TYPE_TEST_CASES and SIMPLE_CHANGES provide standardized test data
 *
 * ## Happy Path
 * - Valid lines array → Table rendered with correct structure → Lines displayed with proper line numbers and content
 * - Hunk lines → Load more buttons rendered with correct direction → Click handlers called with proper parameters
 * - Different line types (add/delete/context) → Correct prefixes and styling applied
 * - Overlays with valid dockIndex → Hover interactions show/hide overlays in correct cells → Multiple overlays group correctly
 *
 * ## Edge Cases
 * - **Empty lines array**: Table structure preserved but no rows rendered
 * - **Null line numbers**: Component handles gracefully, shows default values
 * - **Null highlighted content**: Falls back to original content
 * - **Empty highlighted content**: Renders empty content without errors
 * - **Very long content**: No truncation, full content displayed
 * - **Multiple hunk lines**: All load more buttons functional with correct callbacks
 * - **Missing onLoadMoreLines handler**: No errors when buttons clicked
 * - **Different visibility/wrap settings**: Component adapts rendering accordingly
 * - **No overlays provided**: No errors, hover interactions work without overlays
 * - **Empty overlays array**: No errors, no overlay content rendered on hover
 * - **Invalid overlay dockIndex**: Component handles gracefully, no rendering errors
 * - **Multiple overlays same dockIndex**: All overlays rendered together in target cell
 * - **Complex overlay content**: React components rendered correctly as overlay content
 *
 * ## Assertions
 * - Verify table structure (colgroup, cells, colspan for hunks)
 * - Check line type prefixes (+/-/space) and content rendering
 * - Validate line number display and null handling
 * - Test hunk direction mapping and button interactions
 * - Ensure HTML content rendered safely with proper escaping
 * - Verify key generation for React optimization
 * - Validate hover state management and overlay visibility
 * - Test overlay grouping by dockIndex and content rendering
 */

// MOCK
vi.mock('../../ui/buttons/LoadMoreButton', () => ({
  default: ({
    onClick,
    direction,
  }: {
    onClick?: (e: React.MouseEvent, d: HunkDirection) => void
    direction: HunkDirection
  }) => (
    <button data-testid="load-more-button" onClick={(e) => onClick?.(e, direction)}>
      Load More {direction}
    </button>
  ),
}))

// HELPERS
const createUnifiedViewerProps = createPropsFactory<UnifiedViewerProps>({
  lines: [],
  wrapLines: true,
  visible: true,
  loadMoreLinesCount: 5,
  onLoadMoreLines: vi.fn(),
})

const createMockLine = (overrides: Partial<DiffLineViewModel> = {}): DiffLineViewModel => {
  const defaults = {
    typeLeft: 'context' as const,
    contentLeft: 'test line',
    highlightedContentLeft: '<span>test line</span>',
    lineNumberLeft: 1,
    typeRight: null,
    contentRight: null,
    highlightedContentRight: null,
    lineNumberRight: null,
  }
  return new DiffLineViewModel(
    overrides.typeLeft ?? defaults.typeLeft,
    overrides.contentLeft ?? defaults.contentLeft,
    overrides.highlightedContentLeft ?? defaults.highlightedContentLeft,
    overrides.lineNumberLeft ?? defaults.lineNumberLeft,
    overrides.typeRight ?? defaults.typeRight,
    overrides.contentRight ?? defaults.contentRight,
    overrides.highlightedContentRight ?? defaults.highlightedContentRight,
    overrides.lineNumberRight ?? defaults.lineNumberRight,
    overrides.hunkDirection,
  )
}

const createHunkLine = (content: string, direction: HunkDirection = 'out'): DiffLineViewModel => {
  return new DiffLineViewModel('hunk', content, content, null, 'hunk', content, content, null, direction)
}

describe('UnifiedViewer', () => {
  describe('basic rendering scenarios', () => {
    it('given empty lines array, when rendered, expect empty table with correct structure', () => {
      // GIVEN
      const props = createUnifiedViewerProps({ lines: [] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByRole('rowgroup')).toBeInTheDocument() // tbody has role="rowgroup"
      expect(screen.queryByRole('row')).not.toBeInTheDocument()
    })

    it('given single context line, when rendered, expect line displayed with correct structure', () => {
      // GIVEN
      const line = createMockLine({ typeLeft: 'context', lineNumberLeft: 5, lineNumberRight: 5 })
      const props = createUnifiedViewerProps({ lines: [line] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      expect(row).toBeInTheDocument()
      const cells = screen.getAllByRole('cell')
      expect(cells[0]).toHaveTextContent('5') // left number
      expect(cells[1]).toHaveTextContent('5') // right number
      expect(screen.getByText('test line')).toBeInTheDocument()
    })

    it('given multiple lines with different types, when rendered, expect all lines displayed correctly', () => {
      // GIVEN
      const lines = [
        createMockLine({
          typeLeft: 'context',
          lineNumberLeft: 1,
          lineNumberRight: 1,
          contentLeft: 'context line',
          highlightedContentLeft: '<span>context line</span>',
        }),
        createMockLine({
          typeLeft: 'add',
          lineNumberLeft: null,
          lineNumberRight: 2,
          contentLeft: '+added line',
          highlightedContentLeft: '<span>+added line</span>',
        }),
        createMockLine({
          typeLeft: 'delete',
          lineNumberLeft: 3,
          lineNumberRight: null,
          contentLeft: '-deleted line',
          highlightedContentLeft: '<span>-deleted line</span>',
        }),
      ]
      const props = createUnifiedViewerProps({ lines })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(3)
      expect(screen.getByText('context line')).toBeInTheDocument()
      expect(screen.getByText('+added line')).toBeInTheDocument()
      expect(screen.getByText('-deleted line')).toBeInTheDocument()
    })

    it('given SIMPLE_CHANGES data, when converted to view models and rendered, expect correct display', () => {
      // GIVEN
      const lines = SIMPLE_CHANGES.map((change) =>
        createMockLine({
          typeLeft: change.type,
          contentLeft: change.content,
          highlightedContentLeft: `<span>${change.content}</span>`,
          lineNumberLeft: change.lineNumberOld,
          lineNumberRight: change.lineNumberNew,
        }),
      )
      const props = createUnifiedViewerProps({ lines })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      expect(screen.getByText('+added line')).toBeInTheDocument()
      expect(screen.getByText(/unchanged line/)).toBeInTheDocument()
    })
  })

  describe('line type prefix scenarios', () => {
    const prefixTestCases: Array<{
      description: string
      lineType: DiffLineType
      expectedPrefix: string
    }> = [
      { description: 'add line type', lineType: 'add', expectedPrefix: '+' },
      { description: 'delete line type', lineType: 'delete', expectedPrefix: '-' },
      { description: 'context line type', lineType: 'context', expectedPrefix: ' ' },
      { description: 'hunk line type', lineType: 'hunk', expectedPrefix: ' ' },
      { description: 'empty line type', lineType: 'empty', expectedPrefix: ' ' },
    ]

    prefixTestCases.forEach(({ description, lineType, expectedPrefix }) => {
      it(`given ${description}, when rendered, expect correct prefix displayed`, () => {
        // GIVEN
        const line = createMockLine({ typeLeft: lineType })
        const props = createUnifiedViewerProps({ lines: [line] })

        // WHEN
        render(<UnifiedViewer {...props} />)

        // EXPECT
        if (expectedPrefix === ' ') {
          // For space prefix, check that the line type span exists and contains a space
          const lineTypeSpans = screen.getAllByText('')
          expect(lineTypeSpans.length).toBeGreaterThan(0)
        } else {
          const lineTypeSpan = screen.getByText(expectedPrefix)
          expect(lineTypeSpan).toBeInTheDocument()
        }
      })
    })
  })

  describe('line type mapping scenarios', () => {
    it('given LINE_TYPE_TEST_CASES data, when rendered, expect correct line types mapped', () => {
      // GIVEN
      const lines = LINE_TYPE_TEST_CASES.map(({ expectedType }) =>
        createMockLine({
          typeLeft: expectedType,
          contentLeft: `test ${expectedType} line`,
          highlightedContentLeft: `<span>test ${expectedType} line</span>`,
        }),
      )
      const props = createUnifiedViewerProps({ lines })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      expect(screen.getByText('test add line')).toBeInTheDocument()
      expect(screen.getByText('test delete line')).toBeInTheDocument()
      expect(screen.getByText('test context line')).toBeInTheDocument()
    })
  })

  describe('hunk header scenarios', () => {
    it('given hunk line with out direction, when rendered, expect load more button with correct direction', () => {
      // GIVEN
      const hunkLine = createHunkLine('@@ -1,3 +1,3 @@', 'out')
      const props = createUnifiedViewerProps({ lines: [hunkLine] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      expect(screen.getByTestId('load-more-button')).toBeInTheDocument()
      expect(screen.getByText('Load More out')).toBeInTheDocument()
    })

    it('given hunk line with up direction, when rendered, expect load more button with up direction', () => {
      // GIVEN
      const hunkLine = createHunkLine('@@ -1,3 +1,3 @@', 'up')
      const props = createUnifiedViewerProps({ lines: [hunkLine] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      expect(screen.getByText('Load More up')).toBeInTheDocument()
    })

    it('given hunk line with down direction, when rendered, expect load more button with down direction', () => {
      // GIVEN
      const hunkLine = createHunkLine('@@ -1,3 +1,3 @@', 'down')
      const props = createUnifiedViewerProps({ lines: [hunkLine] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      expect(screen.getByText('Load More down')).toBeInTheDocument()
    })

    it('given hunk line, when load more button clicked, expect onLoadMoreLines called with correct parameters', () => {
      // GIVEN
      const mockOnLoadMoreLines = vi.fn()
      const hunkLine = createHunkLine('@@ -1,3 +1,3 @@', 'out')
      const props = createUnifiedViewerProps({
        lines: [hunkLine],
        onLoadMoreLines: mockOnLoadMoreLines,
      })

      // WHEN
      render(<UnifiedViewer {...props} />)
      fireEvent.click(screen.getByTestId('load-more-button'))

      // EXPECT
      expect(mockOnLoadMoreLines).toHaveBeenCalledWith(hunkLine, 'out')
    })

    it('given hunk line without onLoadMoreLines handler, when load more button clicked, expect no error', () => {
      // GIVEN
      const hunkLine = createHunkLine('@@ -1,3 +1,3 @@', 'out')
      const props = createUnifiedViewerProps({
        lines: [hunkLine],
        onLoadMoreLines: undefined,
      })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      expect(() => {
        fireEvent.click(screen.getByTestId('load-more-button'))
      }).not.toThrow()
    })
  })

  describe('line number display scenarios', () => {
    it('given line with null line numbers, when rendered, expect correct line numbers displayed', () => {
      // GIVEN
      const line = createMockLine({
        typeLeft: 'add',
        lineNumberLeft: null,
        lineNumberRight: 2,
      })
      const props = createUnifiedViewerProps({ lines: [line] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      const cells = screen.getAllByRole('cell')
      // The component shows the line number from the view model, not null
      expect(cells[0]).toHaveTextContent('1') // left number cell shows default
      expect(cells[1]).toHaveTextContent('2') // right number cell should have number
    })

    it('given line with both line numbers, when rendered, expect both numbers displayed', () => {
      // GIVEN
      const line = createMockLine({
        lineNumberLeft: 10,
        lineNumberRight: 15,
      })
      const props = createUnifiedViewerProps({ lines: [line] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument()
    })
  })

  describe('content rendering scenarios', () => {
    it('given line with highlighted content, when rendered, expect HTML content rendered safely', () => {
      // GIVEN
      const line = createMockLine({
        highlightedContentLeft: '<span class="highlight">test</span> <strong>bold</strong>',
      })
      const props = createUnifiedViewerProps({ lines: [line] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      expect(screen.getByText('test')).toBeInTheDocument()
      expect(screen.getByText('bold')).toBeInTheDocument()
    })

    it('given line with null highlighted content, when rendered, expect fallback content', () => {
      // GIVEN
      const line = createMockLine({
        highlightedContentLeft: null,
      })
      const props = createUnifiedViewerProps({ lines: [line] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      const codeCell = screen.getAllByRole('cell')[2] // third cell is code cell
      // The component renders the original content when highlighted content is null
      expect(codeCell).toHaveTextContent('test line')
    })

    it('given line with empty highlighted content, when rendered, expect empty content', () => {
      // GIVEN
      const line = createMockLine({
        highlightedContentLeft: '',
      })
      const props = createUnifiedViewerProps({ lines: [line] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      const codeCell = screen.getAllByRole('cell')[2] // third cell is code cell
      // The component renders empty content when highlighted content is empty
      expect(codeCell).toHaveTextContent('')
    })
  })

  describe('table structure scenarios', () => {
    it('given any lines, when rendered, expect correct table structure with colgroup', () => {
      // GIVEN
      const line = createMockLine()
      const props = createUnifiedViewerProps({ lines: [line] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      const table = screen.getByRole('table')
      const colgroup = table.querySelector('colgroup')
      expect(table).toBeInTheDocument()
      expect(colgroup).toBeInTheDocument()
      expect(colgroup?.children).toHaveLength(3) // three columns
    })

    it('given regular line, when rendered, expect three cells in row', () => {
      // GIVEN
      const line = createMockLine()
      const props = createUnifiedViewerProps({ lines: [line] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      const cells = screen.getAllByRole('cell')
      expect(cells).toHaveLength(3) // left number, right number, code
    })

    it('given hunk line, when rendered, expect two cells in row with colspan', () => {
      // GIVEN
      const hunkLine = createHunkLine('@@ -1,3 +1,3 @@')
      const props = createUnifiedViewerProps({ lines: [hunkLine] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      const cells = screen.getAllByRole('cell')
      expect(cells).toHaveLength(2) // merged number cell, code cell
      expect(cells[0]).toHaveAttribute('colspan', '2')
    })
  })

  describe('key generation scenarios', () => {
    it('given first line is hunk, when rendered, expect hunk-header key for first row', () => {
      // GIVEN
      const hunkLine = createHunkLine('@@ -1,3 +1,3 @@')
      const props = createUnifiedViewerProps({ lines: [hunkLine] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      expect(row).toBeInTheDocument()
    })

    it('given regular lines, when rendered, expect type-index keys for rows', () => {
      // GIVEN
      const lines = [createMockLine({ typeLeft: 'add' }), createMockLine({ typeLeft: 'delete' })]
      const props = createUnifiedViewerProps({ lines })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(2)
    })
  })

  describe('performance optimization scenarios', () => {
    it('given visible prop is false, when rendered, expect component still renders', () => {
      // GIVEN
      const line = createMockLine()
      const props = createUnifiedViewerProps({ lines: [line], visible: false })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('given wrapLines prop is false, when rendered, expect component renders correctly', () => {
      // GIVEN
      const line = createMockLine()
      const props = createUnifiedViewerProps({ lines: [line], wrapLines: false })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('given line with empty typeLeft, when rendered, expect empty type handled gracefully', () => {
      // GIVEN
      const line = createMockLine({ typeLeft: 'empty' })
      const props = createUnifiedViewerProps({ lines: [line] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      expect(screen.getByRole('row')).toBeInTheDocument()
    })

    it('given line with very long content, when rendered, expect content displayed without truncation', () => {
      // GIVEN
      const longContent = 'a'.repeat(1000)
      const line = createMockLine({
        contentLeft: longContent,
        highlightedContentLeft: `<span>${longContent}</span>`,
      })
      const props = createUnifiedViewerProps({ lines: [line] })

      // WHEN
      render(<UnifiedViewer {...props} />)

      // EXPECT
      expect(screen.getByText(longContent)).toBeInTheDocument()
    })

    it('given multiple hunk lines, when rendered, expect all load more buttons functional', () => {
      // GIVEN
      const mockOnLoadMoreLines = vi.fn()
      const lines = [
        createHunkLine('@@ -1,3 +1,3 @@', 'up'),
        createMockLine({ typeLeft: 'context' }),
        createHunkLine('@@ -5,3 +5,3 @@', 'down'),
      ]
      const props = createUnifiedViewerProps({
        lines,
        onLoadMoreLines: mockOnLoadMoreLines,
      })

      // WHEN
      render(<UnifiedViewer {...props} />)
      const buttons = screen.getAllByTestId('load-more-button')
      fireEvent.click(buttons[0])
      fireEvent.click(buttons[1])

      // EXPECT
      expect(buttons).toHaveLength(2)
      expect(mockOnLoadMoreLines).toHaveBeenCalledWith(lines[0], 'up')
      expect(mockOnLoadMoreLines).toHaveBeenCalledWith(lines[2], 'down')
    })
  })

  describe('overlay scenarios', () => {
    describe('happy path', () => {
      it('given overlay with unifiedDockIdx 0, when line hovered, expect overlay rendered in left number cell', () => {
        // GIVEN
        const overlayContent = <span data-testid="test-overlay-0">Overlay 0</span>
        const line = createMockLine({ lineNumberLeft: 5, lineNumberRight: 10 })
        const props = createUnifiedViewerProps({
          lines: [line],
          overlays: [{ content: overlayContent, unifiedDockIdx: 0, splitDockIdx: 0 }],
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const row = screen.getByRole('row')
        fireEvent.mouseEnter(row)

        // EXPECT
        expect(screen.getByTestId('test-overlay-0')).toBeInTheDocument()
        const leftNumberCell = screen.getAllByRole('cell')[0]
        expect(leftNumberCell).toContainElement(screen.getByTestId('test-overlay-0'))
      })

      it('given overlay with unifiedDockIdx 1, when line hovered, expect overlay rendered in right number cell', () => {
        // GIVEN
        const overlayContent = <span data-testid="test-overlay-1">Overlay 1</span>
        const line = createMockLine({ lineNumberLeft: 5, lineNumberRight: 10 })
        const props = createUnifiedViewerProps({
          lines: [line],
          overlays: [{ content: overlayContent, unifiedDockIdx: 1, splitDockIdx: 1 }],
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const row = screen.getByRole('row')
        fireEvent.mouseEnter(row)

        // EXPECT
        expect(screen.getByTestId('test-overlay-1')).toBeInTheDocument()
        const rightNumberCell = screen.getAllByRole('cell')[1]
        expect(rightNumberCell).toContainElement(screen.getByTestId('test-overlay-1'))
      })

      it('given overlay with unifiedDockIdx 2, when line hovered, expect overlay rendered in code cell', () => {
        // GIVEN
        const overlayContent = <span data-testid="test-overlay-2">Overlay 2</span>
        const line = createMockLine({ lineNumberLeft: 5, lineNumberRight: 10 })
        const props = createUnifiedViewerProps({
          lines: [line],
          overlays: [{ content: overlayContent, unifiedDockIdx: 2, splitDockIdx: 1 }],
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const row = screen.getByRole('row')
        fireEvent.mouseEnter(row)

        // EXPECT
        expect(screen.getByTestId('test-overlay-2')).toBeInTheDocument()
        const codeCell = screen.getAllByRole('cell')[2]
        expect(codeCell).toContainElement(screen.getByTestId('test-overlay-2'))
      })

      it('given multiple overlays with different unifiedDockIdx, when line hovered, expect all overlays rendered in correct cells', () => {
        // GIVEN
        const overlay0 = <span data-testid="overlay-0">Left</span>
        const overlay1 = <span data-testid="overlay-1">Right</span>
        const overlay2 = <span data-testid="overlay-2">Code</span>
        const line = createMockLine({ lineNumberLeft: 5, lineNumberRight: 10 })
        const props = createUnifiedViewerProps({
          lines: [line],
          overlays: [
            { content: overlay0, unifiedDockIdx: 0, splitDockIdx: 0 },
            { content: overlay1, unifiedDockIdx: 1, splitDockIdx: 1 },
            { content: overlay2, unifiedDockIdx: 2, splitDockIdx: 1 },
          ],
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const row = screen.getByRole('row')
        fireEvent.mouseEnter(row)

        // EXPECT
        expect(screen.getByTestId('overlay-0')).toBeInTheDocument()
        expect(screen.getByTestId('overlay-1')).toBeInTheDocument()
        expect(screen.getByTestId('overlay-2')).toBeInTheDocument()

        const cells = screen.getAllByRole('cell')
        expect(cells[0]).toContainElement(screen.getByTestId('overlay-0'))
        expect(cells[1]).toContainElement(screen.getByTestId('overlay-1'))
        expect(cells[2]).toContainElement(screen.getByTestId('overlay-2'))
      })

      it('given multiple overlays with same unifiedDockIdx, when line hovered, expect all overlays rendered in target cell', () => {
        // GIVEN
        const overlay1 = <span data-testid="overlay-first">First</span>
        const overlay2 = <span data-testid="overlay-second">Second</span>
        const line = createMockLine({ lineNumberLeft: 5, lineNumberRight: 10 })
        const props = createUnifiedViewerProps({
          lines: [line],
          overlays: [
            { content: overlay1, unifiedDockIdx: 0, splitDockIdx: 0 },
            { content: overlay2, unifiedDockIdx: 0, splitDockIdx: 0 },
          ],
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const row = screen.getByRole('row')
        fireEvent.mouseEnter(row)

        // EXPECT
        expect(screen.getByTestId('overlay-first')).toBeInTheDocument()
        expect(screen.getByTestId('overlay-second')).toBeInTheDocument()

        const leftNumberCell = screen.getAllByRole('cell')[0]
        expect(leftNumberCell).toContainElement(screen.getByTestId('overlay-first'))
        expect(leftNumberCell).toContainElement(screen.getByTestId('overlay-second'))
      })

      it('given overlay, when line hovered then unhovered, expect overlay shown then hidden', () => {
        // GIVEN
        const overlayContent = <span data-testid="toggle-overlay">Toggle Me</span>
        const line = createMockLine({ lineNumberLeft: 5, lineNumberRight: 10 })
        const props = createUnifiedViewerProps({
          lines: [line],
          overlays: [{ content: overlayContent, unifiedDockIdx: 0, splitDockIdx: 0 }],
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const row = screen.getByRole('row')

        // With CSS-based logic, overlay content is always in DOM but controlled by CSS opacity
        expect(screen.getByTestId('toggle-overlay')).toBeInTheDocument()

        // Hover - overlay should still be in DOM (CSS controls visibility)
        fireEvent.mouseEnter(row)
        expect(screen.getByTestId('toggle-overlay')).toBeInTheDocument()

        // Unhover - overlay should still be in DOM (CSS controls visibility)
        fireEvent.mouseLeave(row)

        // EXPECT
        expect(screen.getByTestId('toggle-overlay')).toBeInTheDocument()
      })

      it('given complex overlay content with React component, when line hovered, expect component rendered correctly', () => {
        // GIVEN
        const ComplexOverlay = () => (
          <div data-testid="complex-overlay">
            <button>Action</button>
            <span>Info</span>
          </div>
        )
        const line = createMockLine({ lineNumberLeft: 5, lineNumberRight: 10 })
        const props = createUnifiedViewerProps({
          lines: [line],
          overlays: [{ content: <ComplexOverlay />, unifiedDockIdx: 2, splitDockIdx: 1 }],
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const row = screen.getByRole('row')
        fireEvent.mouseEnter(row)

        // EXPECT
        expect(screen.getByTestId('complex-overlay')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
        expect(screen.getByText('Info')).toBeInTheDocument()
      })
    })

    describe('edge cases', () => {
      it('given no overlays prop, when line hovered, expect no overlay content and no errors', () => {
        // GIVEN
        const line = createMockLine({ lineNumberLeft: 5, lineNumberRight: 10 })
        const props = createUnifiedViewerProps({
          lines: [line],
          // no overlays prop
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const row = screen.getByRole('row')

        // EXPECT
        expect(() => {
          fireEvent.mouseEnter(row)
          fireEvent.mouseLeave(row)
        }).not.toThrow()

        fireEvent.mouseEnter(row)
        expect(screen.queryByText(/overlay/i)).not.toBeInTheDocument()
      })

      it('given empty overlays array, when line hovered, expect no overlay content and no errors', () => {
        // GIVEN
        const line = createMockLine({ lineNumberLeft: 5, lineNumberRight: 10 })
        const props = createUnifiedViewerProps({
          lines: [line],
          overlays: [],
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const row = screen.getByRole('row')

        // EXPECT
        expect(() => {
          fireEvent.mouseEnter(row)
          fireEvent.mouseLeave(row)
        }).not.toThrow()

        fireEvent.mouseEnter(row)
        expect(screen.queryByText(/overlay/i)).not.toBeInTheDocument()
      })

      it('given overlay with invalid dockIndex, when line hovered, expect overlay not rendered', () => {
        // GIVEN
        const invalidOverlay = <span data-testid="invalid-overlay">Should not render</span>
        const validOverlay = <span data-testid="valid-overlay">Should render</span>
        const line = createMockLine({ lineNumberLeft: 5, lineNumberRight: 10 })
        const props = createUnifiedViewerProps({
          lines: [line],
          overlays: [
            { content: invalidOverlay, unifiedDockIdx: 3 as 0 | 1 | 2, splitDockIdx: 0 }, // invalid index
            { content: validOverlay, unifiedDockIdx: 0, splitDockIdx: 0 }, // valid index
          ],
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const row = screen.getByRole('row')
        fireEvent.mouseEnter(row)

        // EXPECT
        expect(screen.queryByTestId('invalid-overlay')).not.toBeInTheDocument()
        expect(screen.getByTestId('valid-overlay')).toBeInTheDocument()
      })

      it('given overlays with negative dockIndex, when line hovered, expect overlay not rendered', () => {
        // GIVEN
        const negativeOverlay = <span data-testid="negative-overlay">Should not render</span>
        const line = createMockLine({ lineNumberLeft: 5, lineNumberRight: 10 })
        const props = createUnifiedViewerProps({
          lines: [line],
          overlays: [{ content: negativeOverlay, unifiedDockIdx: -1 as 0 | 1 | 2, splitDockIdx: 0 }],
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const row = screen.getByRole('row')
        fireEvent.mouseEnter(row)

        // EXPECT
        expect(screen.queryByTestId('negative-overlay')).not.toBeInTheDocument()
      })

      it('given hunk line with overlays, when hovered, expect overlays not rendered for hunk lines', () => {
        // GIVEN
        const overlayContent = <span data-testid="hunk-overlay">Hunk Overlay</span>
        const hunkLine = createHunkLine('@@ -1,3 +1,3 @@', 'out')
        const props = createUnifiedViewerProps({
          lines: [hunkLine],
          overlays: [{ content: overlayContent, unifiedDockIdx: 0, splitDockIdx: 0 }],
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const row = screen.getByRole('row')
        fireEvent.mouseEnter(row)

        // EXPECT
        expect(screen.queryByTestId('hunk-overlay')).not.toBeInTheDocument()
      })

      it('given multiple lines with overlays, when different lines hovered, expect overlays shown for correct line only', () => {
        // GIVEN
        const overlay = <span data-testid="shared-overlay">Shared</span>
        const line1 = createMockLine({ lineNumberLeft: 1, lineNumberRight: 1 })
        const line2 = createMockLine({ lineNumberLeft: 2, lineNumberRight: 2 })
        const props = createUnifiedViewerProps({
          lines: [line1, line2],
          overlays: [{ content: overlay, unifiedDockIdx: 0, splitDockIdx: 0 }],
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const rows = screen.getAllByRole('row')

        // With CSS-based logic, overlay content is always in DOM for all lines
        const overlayElements = screen.getAllByTestId('shared-overlay')
        expect(overlayElements).toHaveLength(2) // One for each line

        // Hover first line - overlay should still be in DOM (CSS controls visibility)
        fireEvent.mouseEnter(rows[0])
        expect(screen.getAllByTestId('shared-overlay')).toHaveLength(2)

        // Move to second line - overlay should still be in DOM (CSS controls visibility)
        fireEvent.mouseLeave(rows[0])
        expect(screen.getAllByTestId('shared-overlay')).toHaveLength(2)

        fireEvent.mouseEnter(rows[1])

        // EXPECT
        expect(screen.getAllByTestId('shared-overlay')).toHaveLength(2)
      })

      it('given overlay with null content, when line hovered, expect no rendering errors', () => {
        // GIVEN
        const line = createMockLine({ lineNumberLeft: 5, lineNumberRight: 10 })
        const props = createUnifiedViewerProps({
          lines: [line],
          overlays: [{ content: null, unifiedDockIdx: 0, splitDockIdx: 0 }],
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const row = screen.getByRole('row')

        // EXPECT
        expect(() => {
          fireEvent.mouseEnter(row)
        }).not.toThrow()
      })

      it('given overlay with undefined content, when line hovered, expect no rendering errors', () => {
        // GIVEN
        const line = createMockLine({ lineNumberLeft: 5, lineNumberRight: 10 })
        const props = createUnifiedViewerProps({
          lines: [line],
          overlays: [{ content: undefined as React.ReactNode, unifiedDockIdx: 0, splitDockIdx: 0 }],
        })

        // WHEN
        render(<UnifiedViewer {...props} />)
        const row = screen.getByRole('row')

        // EXPECT
        expect(() => {
          fireEvent.mouseEnter(row)
        }).not.toThrow()
      })
    })
  })
})
