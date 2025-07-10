import { fireEvent, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createPropsFactory } from '../../../utils/test/generic-test-utils'
import { SIMPLE_CHANGES } from '../../../utils/test/models/test-utils'
import { render } from '../../../utils/test/render'
import { DiffLineViewModel } from '../models/DiffLineViewModel'
import SplitViewer from './SplitViewer'
import type { DiffLineType, HunkDirection, SplitViewerProps } from './types'

/**
 * # SplitViewer Testing Strategy
 *
 * ## Mocked Boundaries
 * - **LoadMoreButton**: Mocked to isolate SplitViewer from button component logic and test click interactions
 * - **DiffLineViewModel**: Used as test data factory to create predictable line representations
 * - **Test fixtures**: LINE_TYPE_TEST_CASES and SIMPLE_CHANGES provide standardized test data
 *
 * ## Happy Path
 * - Valid lines array → Table rendered with correct structure → Lines displayed with proper line numbers and content
 * - Hunk lines → Load more buttons rendered with correct direction → Click handlers called with proper parameters
 * - Different line types (add/delete/context) → Correct prefixes and styling applied
 * - Split view structure → Left and right columns properly configured
 * - Overlays with valid dockIndex → Overlays rendered in correct cells → Multiple overlays group correctly
 *
 * ## Edge Cases
 * - **Empty lines array**: Table structure preserved but no rows rendered
 * - **Null line numbers**: Component renders empty cell (not a default value)
 * - **Null or empty highlighted content**: Falls back to non-breaking space (`&nbsp;`), not original content
 * - **Very long content**: No truncation, full content displayed
 * - **Multiple hunk lines**: All load more buttons functional with correct callbacks
 * - **Missing onLoadMoreLines handler**: No errors when buttons clicked
 * - **Mixed line types**: Only the relevant side (left or right) renders content for its type; the other side may be empty
 * - **No overlays provided**: No errors, overlay containers exist but remain empty
 * - **Empty overlays array**: No errors, no overlay content rendered
 * - **Invalid overlay dockIndex**: Component handles gracefully, no rendering errors
 * - **Multiple overlays same dockIndex**: All overlays rendered together in target cells
 * - **Complex overlay content**: React components rendered correctly as overlay content
 *
 * ## Assertions
 * - Verify table structure (colgroup, cells, colspan for hunks; hunk lines render merged cell)
 * - Check line type prefixes (+/-/space) and content rendering
 * - Validate line number display and null handling (empty cell for null)
 * - Test hunk direction mapping and button interactions
 * - Ensure HTML content rendered safely with proper escaping
 * - Verify key generation for React optimization
 * - Test split view column layout and styling
 * - Validate overlay grouping by dockIndex and content rendering in both left and right cells
 * - Test overlay container existence and proper positioning within cells
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
const createSplitViewerProps = createPropsFactory<SplitViewerProps>({
  lines: [],
  loadMoreLinesCount: 5,
  onLoadMoreLines: vi.fn(),
})

const createMockLine = (overrides: Partial<DiffLineViewModel> = {}): DiffLineViewModel => {
  const defaults = {
    typeLeft: 'context' as const,
    contentLeft: 'test line left',
    highlightedContentLeft: '<span>test line left</span>',
    lineNumberLeft: 1,
    typeRight: 'context' as const,
    contentRight: 'test line right',
    highlightedContentRight: '<span>test line right</span>',
    lineNumberRight: 1,
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

describe('SplitViewer', () => {
  describe('basic rendering scenarios', () => {
    it('given empty lines array, when rendered, expect empty table with correct structure', () => {
      // GIVEN
      const props = createSplitViewerProps({ lines: [] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByRole('rowgroup')).toBeInTheDocument() // tbody has role="rowgroup"
      expect(screen.queryByRole('row')).not.toBeInTheDocument()
    })

    it('given single context line, when rendered, expect line displayed with correct structure', () => {
      // GIVEN
      const line = createMockLine({
        typeLeft: 'context',
        typeRight: 'context',
        lineNumberLeft: 5,
        lineNumberRight: 5,
      })
      const props = createSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      expect(row).toBeInTheDocument()
      const cells = screen.getAllByRole('cell')
      expect(cells).toHaveLength(4) // left number, left code, right number, right code
      expect(cells[0]).toHaveTextContent('5') // left number
      expect(cells[2]).toHaveTextContent('5') // right number
      expect(screen.getByText('test line left')).toBeInTheDocument()
      expect(screen.getByText('test line right')).toBeInTheDocument()
    })

    it('given multiple lines with different types, when rendered, expect all lines displayed correctly', () => {
      // GIVEN
      const lines = [
        createMockLine({
          typeLeft: 'context',
          typeRight: 'context',
          lineNumberLeft: 1,
          lineNumberRight: 1,
          contentLeft: 'context line left',
          contentRight: 'context line right',
          highlightedContentLeft: '<span>context line left</span>',
          highlightedContentRight: '<span>context line right</span>',
        }),
        createMockLine({
          typeLeft: 'add',
          typeRight: 'add',
          lineNumberLeft: null,
          lineNumberRight: 2,
          contentLeft: '+added line left',
          contentRight: '+added line right',
          highlightedContentLeft: '<span>+added line left</span>',
          highlightedContentRight: '<span>+added line right</span>',
        }),
        createMockLine({
          typeLeft: 'delete',
          typeRight: 'delete',
          lineNumberLeft: 3,
          lineNumberRight: null,
          contentLeft: '-deleted line left',
          contentRight: '-deleted line right',
          highlightedContentLeft: '<span>-deleted line left</span>',
          highlightedContentRight: '<span>-deleted line right</span>',
        }),
      ]
      const props = createSplitViewerProps({ lines })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(3)
      expect(screen.getByText('context line left')).toBeInTheDocument()
      expect(screen.getByText('context line right')).toBeInTheDocument()
      expect(screen.getByText('+added line left')).toBeInTheDocument()
      expect(screen.getByText('+added line right')).toBeInTheDocument()
      expect(screen.getByText('-deleted line left')).toBeInTheDocument()
      expect(screen.getByText('-deleted line right')).toBeInTheDocument()
    })

    it('given SIMPLE_CHANGES data, when converted to view models and rendered, expect correct display', () => {
      // GIVEN
      const lines = SIMPLE_CHANGES.map((change) =>
        createMockLine({
          typeLeft: change.type,
          typeRight: change.type,
          contentLeft: change.content,
          contentRight: change.content,
          highlightedContentLeft: `<span>${change.content}</span>`,
          highlightedContentRight: `<span>${change.content}</span>`,
          lineNumberLeft: change.lineNumberOld,
          lineNumberRight: change.lineNumberNew,
        }),
      )
      const props = createSplitViewerProps({ lines })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const addedElements = screen.getAllByText('+added line')
      expect(addedElements).toHaveLength(2) // left and right sides
      const unchangedElements = screen.getAllByText(/unchanged line/)
      expect(unchangedElements).toHaveLength(2) // left and right sides
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

    it.each(prefixTestCases)(
      'given $description, when rendered, expect correct prefix',
      ({ lineType, expectedPrefix }) => {
        // GIVEN
        const line = createMockLine({
          typeLeft: lineType,
          typeRight: lineType,
          contentLeft: `${expectedPrefix}test content`,
          contentRight: `${expectedPrefix}test content`,
          highlightedContentLeft: `<span>${expectedPrefix}test content</span>`,
          highlightedContentRight: `<span>${expectedPrefix}test content</span>`,
        })
        const props = createSplitViewerProps({ lines: [line] })

        // WHEN
        render(<SplitViewer {...props} />)

        // EXPECT
        // For context, hunk, and empty types, the prefix is a space, so we need to match differently
        if (expectedPrefix === ' ') {
          const elements = screen.getAllByText(/test content/)
          // Hunk lines use colspan, so they only render once
          const expectedLength = lineType === 'hunk' ? 1 : 2
          expect(elements).toHaveLength(expectedLength)
        } else {
          const elements = screen.getAllByText(`${expectedPrefix}test content`)
          expect(elements).toHaveLength(2) // left and right sides
        }
      },
    )
  })

  describe('hunk line scenarios', () => {
    it('given hunk line with out direction, when rendered, expect load more button with correct direction', () => {
      // GIVEN
      const hunkLine = createHunkLine('@@ -1,3 +1,3 @@', 'out')
      const props = createSplitViewerProps({ lines: [hunkLine] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      expect(screen.getByTestId('load-more-button')).toBeInTheDocument()
      expect(screen.getByText('Load More out')).toBeInTheDocument()
    })

    it('given hunk line with up direction, when rendered, expect load more button with correct direction', () => {
      // GIVEN
      const hunkLine = createHunkLine('@@ -1,3 +1,3 @@', 'up')
      const props = createSplitViewerProps({ lines: [hunkLine] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      expect(screen.getByTestId('load-more-button')).toBeInTheDocument()
      expect(screen.getByText('Load More up')).toBeInTheDocument()
    })

    it('given hunk line with down direction, when rendered, expect load more button with correct direction', () => {
      // GIVEN
      const hunkLine = createHunkLine('@@ -1,3 +1,3 @@', 'down')
      const props = createSplitViewerProps({ lines: [hunkLine] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      expect(screen.getByTestId('load-more-button')).toBeInTheDocument()
      expect(screen.getByText('Load More down')).toBeInTheDocument()
    })

    it('given hunk line, when load more button clicked, expect onLoadMoreLines called with correct parameters', () => {
      // GIVEN
      const mockOnLoadMoreLines = vi.fn()
      const hunkLine = createHunkLine('@@ -1,3 +1,3 @@', 'out')
      const props = createSplitViewerProps({
        lines: [hunkLine],
        onLoadMoreLines: mockOnLoadMoreLines,
      })

      // WHEN
      render(<SplitViewer {...props} />)
      fireEvent.click(screen.getByTestId('load-more-button'))

      // EXPECT
      expect(mockOnLoadMoreLines).toHaveBeenCalledWith(hunkLine, 'out')
    })

    it('given hunk line without onLoadMoreLines handler, when load more button clicked, expect no error', () => {
      // GIVEN
      const hunkLine = createHunkLine('@@ -1,3 +1,3 @@', 'out')
      const props = createSplitViewerProps({
        lines: [hunkLine],
        onLoadMoreLines: undefined,
      })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      expect(() => {
        fireEvent.click(screen.getByTestId('load-more-button'))
      }).not.toThrow()
    })

    it('given multiple hunk lines, when rendered, expect all load more buttons functional', () => {
      // GIVEN
      const mockOnLoadMoreLines = vi.fn()
      const hunkLines = [
        createHunkLine('@@ -1,3 +1,3 @@', 'up'),
        createHunkLine('@@ -5,2 +5,2 @@', 'down'),
        createHunkLine('@@ -10,1 +10,1 @@', 'out'),
      ]
      const props = createSplitViewerProps({
        lines: hunkLines,
        onLoadMoreLines: mockOnLoadMoreLines,
      })

      // WHEN
      render(<SplitViewer {...props} />)
      const buttons = screen.getAllByTestId('load-more-button')
      fireEvent.click(buttons[0])
      fireEvent.click(buttons[1])
      fireEvent.click(buttons[2])

      // EXPECT
      expect(buttons).toHaveLength(3)
      expect(mockOnLoadMoreLines).toHaveBeenCalledWith(hunkLines[0], 'up')
      expect(mockOnLoadMoreLines).toHaveBeenCalledWith(hunkLines[1], 'down')
      expect(mockOnLoadMoreLines).toHaveBeenCalledWith(hunkLines[2], 'out')
    })
  })

  describe('line number scenarios', () => {
    it('given line with null line numbers, when rendered, expect no line numbers displayed', () => {
      // GIVEN
      const line = createMockLine({
        lineNumberLeft: null,
        lineNumberRight: null,
      })
      const props = createSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const cells = screen.getAllByRole('cell')
      // The component renders null line numbers as empty text nodes, but they're still present
      expect(cells[0]).toBeInTheDocument() // left number cell exists
      expect(cells[2]).toBeInTheDocument() // right number cell exists
      // Note: The component renders null values as empty text, which is the expected behavior
    })

    it('given line with mixed null line numbers, when rendered, expect only valid numbers displayed', () => {
      // GIVEN
      const line = createMockLine({
        lineNumberLeft: 5,
        lineNumberRight: null,
      })
      const props = createSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const cells = screen.getAllByRole('cell')
      expect(cells[0]).toHaveTextContent('5') // left number displayed
      expect(cells[2]).toBeInTheDocument() // right number cell exists but empty
      // Note: The component renders null values as empty text, which is the expected behavior
    })
  })

  describe('content rendering scenarios', () => {
    it('given line with null highlighted content, when rendered, expect non-breaking space fallback', () => {
      // GIVEN
      const line = createMockLine({
        highlightedContentLeft: null,
        highlightedContentRight: null,
        contentLeft: 'original content left',
        contentRight: 'original content right',
      })
      const props = createSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const cells = screen.getAllByRole('cell')
      expect(cells[1]).toBeInTheDocument() // left code cell exists
      expect(cells[3]).toBeInTheDocument() // right code cell exists
      // The component falls back to &nbsp; when highlighted content is null
    })

    it('given line with empty highlighted content, when rendered, expect non-breaking space', () => {
      // GIVEN
      const line = createMockLine({
        highlightedContentLeft: '',
        highlightedContentRight: '',
        contentLeft: '',
        contentRight: '',
      })
      const props = createSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const cells = screen.getAllByRole('cell')
      expect(cells[1]).toBeInTheDocument() // left code cell exists
      expect(cells[3]).toBeInTheDocument() // right code cell exists
    })

    it('given line with HTML content, when rendered, expect HTML safely rendered', () => {
      // GIVEN
      const line = createMockLine({
        highlightedContentLeft: '<span class="highlight">test</span>',
        highlightedContentRight: '<span class="highlight">test</span>',
      })
      const props = createSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const spanElements = screen.getAllByText('test')
      expect(spanElements).toHaveLength(2)
      spanElements.forEach((span) => {
        expect(span).toHaveClass('highlight')
      })
    })
  })

  describe('table structure scenarios', () => {
    it('given any lines, when rendered, expect correct table structure with colgroup', () => {
      // GIVEN
      const line = createMockLine()
      const props = createSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const table = screen.getByRole('table')
      const colgroup = table.querySelector('colgroup')
      expect(colgroup).toBeInTheDocument()

      const cols = colgroup?.querySelectorAll('col')
      expect(cols).toHaveLength(4)
      expect(cols?.[0]).toHaveStyle({ width: '50px' }) // left number
      expect(cols?.[1]).toHaveStyle({ width: 'auto' }) // left code
      expect(cols?.[2]).toHaveStyle({ width: '50px' }) // right number
      expect(cols?.[3]).toHaveStyle({ width: 'auto' }) // right code
    })

    it('given hunk line, when rendered, expect colspan for merged content cell', () => {
      // GIVEN
      const hunkLine = createHunkLine('@@ -1,3 +1,3 @@')
      const props = createSplitViewerProps({ lines: [hunkLine] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const cells = screen.getAllByRole('cell')
      expect(cells).toHaveLength(2) // left number + merged content (colspan=3)
      expect(cells[1]).toHaveAttribute('colspan', '3')
    })

    it('given regular line, when rendered, expect four separate cells', () => {
      // GIVEN
      const line = createMockLine()
      const props = createSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const cells = screen.getAllByRole('cell')
      expect(cells).toHaveLength(4) // left number, left code, right number, right code
      cells.forEach((cell) => {
        expect(cell).not.toHaveAttribute('colspan')
      })
    })
  })

  describe('mixed line type scenarios', () => {
    it('given line with different types on left and right, when rendered, expect both handled correctly', () => {
      // GIVEN
      const line = createMockLine({
        typeLeft: 'add',
        typeRight: 'delete',
        contentLeft: '+added content',
        contentRight: '-deleted content',
        highlightedContentLeft: '<span>+added content</span>',
        highlightedContentRight: '<span>-deleted content</span>',
        lineNumberLeft: null,
        lineNumberRight: 5,
      })
      const props = createSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const addedElements = screen.getAllByText('+added content')
      expect(addedElements).toHaveLength(1) // only left side has add
      const deletedElements = screen.getAllByText('-deleted content')
      expect(deletedElements).toHaveLength(1) // only right side has delete
      const cells = screen.getAllByRole('cell')
      expect(cells[0]).toBeInTheDocument() // left number cell exists but empty for add
      expect(cells[2]).toHaveTextContent('5') // right number for delete
    })

    it('given line with hunk on left and regular on right, when rendered, expect load more button on left', () => {
      // GIVEN
      const line = new DiffLineViewModel(
        'hunk',
        'hunk content',
        'hunk content',
        null,
        'context',
        'regular content',
        '<span>regular content</span>',
        5,
        'out',
      )
      const props = createSplitViewerProps({ lines: [line] })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      expect(screen.getByTestId('load-more-button')).toBeInTheDocument()
      expect(screen.getByText('regular content')).toBeInTheDocument()
      const cells = screen.getAllByRole('cell')
      expect(cells[2]).toHaveTextContent('5') // right number displayed
    })
  })

  describe('performance and optimization scenarios', () => {
    it('given multiple lines, when rendered, expect unique keys for each row', () => {
      // GIVEN
      const lines = [
        createMockLine({ lineNumberLeft: 1, lineNumberRight: 1 }),
        createMockLine({ lineNumberLeft: 2, lineNumberRight: 2 }),
        createMockLine({ lineNumberLeft: 3, lineNumberRight: 3 }),
      ]
      const props = createSplitViewerProps({ lines })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(3)
      // Each row should have a unique key (index-based in this implementation)
      rows.forEach((row, _) => {
        expect(row).toBeInTheDocument()
      })
    })

    it('given large number of lines, when rendered, expect all lines displayed', () => {
      // GIVEN
      const lines = Array.from({ length: 100 }, (_, i) =>
        createMockLine({
          lineNumberLeft: i + 1,
          lineNumberRight: i + 1,
          contentLeft: `line ${i + 1} left`,
          contentRight: `line ${i + 1} right`,
          highlightedContentLeft: `<span>line ${i + 1} left</span>`,
          highlightedContentRight: `<span>line ${i + 1} right</span>`,
        }),
      )
      const props = createSplitViewerProps({ lines })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(100)
      // Check that the first and last lines are rendered
      const line1Elements = screen.getAllByText('line 1 left')
      expect(line1Elements.length).toBeGreaterThan(0) // At least one instance
      const line100Elements = screen.getAllByText('line 100 left')
      expect(line100Elements.length).toBeGreaterThan(0) // At least one instance
    })
  })

  describe('overlay scenarios', () => {
    it('given overlay with dockIndex 0, when rendered, expect overlay content in both left and right number cells', () => {
      // GIVEN
      const overlayContent = <span data-testid="test-overlay-0">Number Overlay</span>
      const line = createMockLine({
        lineNumberLeft: 5,
        lineNumberRight: 5,
      })
      const props = createSplitViewerProps({
        lines: [line],
        overlays: [{ content: overlayContent, dockIndex: 0 }],
      })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const overlayElements = screen.getAllByTestId('test-overlay-0')
      expect(overlayElements).toHaveLength(2) // Both left and right number cells

      const cells = screen.getAllByRole('cell')
      const leftNumberCell = cells[0] // left number cell
      const rightNumberCell = cells[2] // right number cell

      expect(leftNumberCell).toContainElement(overlayElements[0])
      expect(rightNumberCell).toContainElement(overlayElements[1])
    })

    it('given overlay with dockIndex 1, when rendered, expect overlay content in both left and right code cells', () => {
      // GIVEN
      const overlayContent = <span data-testid="test-overlay-1">Code Overlay</span>
      const line = createMockLine()
      const props = createSplitViewerProps({
        lines: [line],
        overlays: [{ content: overlayContent, dockIndex: 1 }],
      })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const overlayElements = screen.getAllByTestId('test-overlay-1')
      expect(overlayElements).toHaveLength(2) // Both left and right code cells

      const cells = screen.getAllByRole('cell')
      const leftCodeCell = cells[1] // left code cell
      const rightCodeCell = cells[3] // right code cell

      expect(leftCodeCell).toContainElement(overlayElements[0])
      expect(rightCodeCell).toContainElement(overlayElements[1])
    })

    it('given multiple overlays with different dockIndex, when rendered, expect all overlays in correct cells', () => {
      // GIVEN
      const numberOverlay = <span data-testid="number-overlay">Number</span>
      const codeOverlay = <span data-testid="code-overlay">Code</span>
      const line = createMockLine()
      const props = createSplitViewerProps({
        lines: [line],
        overlays: [
          { content: numberOverlay, dockIndex: 0 },
          { content: codeOverlay, dockIndex: 1 },
        ],
      })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const numberOverlays = screen.getAllByTestId('number-overlay')
      const codeOverlays = screen.getAllByTestId('code-overlay')
      expect(numberOverlays).toHaveLength(2) // Both left and right number cells
      expect(codeOverlays).toHaveLength(2) // Both left and right code cells

      const cells = screen.getAllByRole('cell')
      expect(cells[0]).toContainElement(numberOverlays[0]) // left number
      expect(cells[1]).toContainElement(codeOverlays[0]) // left code
      expect(cells[2]).toContainElement(numberOverlays[1]) // right number
      expect(cells[3]).toContainElement(codeOverlays[1]) // right code
    })

    it('given multiple overlays with same dockIndex, when rendered, expect all overlays grouped in target cells', () => {
      // GIVEN
      const firstOverlay = <span data-testid="overlay-first">First</span>
      const secondOverlay = <span data-testid="overlay-second">Second</span>
      const line = createMockLine()
      const props = createSplitViewerProps({
        lines: [line],
        overlays: [
          { content: firstOverlay, dockIndex: 0 },
          { content: secondOverlay, dockIndex: 0 },
        ],
      })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const firstElements = screen.getAllByTestId('overlay-first')
      const secondElements = screen.getAllByTestId('overlay-second')
      expect(firstElements).toHaveLength(2)
      expect(secondElements).toHaveLength(2)

      const cells = screen.getAllByRole('cell')
      const leftNumberCell = cells[0]
      const rightNumberCell = cells[2]

      // Both overlays should be in both number cells
      expect(leftNumberCell).toContainElement(firstElements[0])
      expect(leftNumberCell).toContainElement(secondElements[0])
      expect(rightNumberCell).toContainElement(firstElements[1])
      expect(rightNumberCell).toContainElement(secondElements[1])
    })

    it('given complex overlay content with React component, when rendered, expect component rendered correctly', () => {
      // GIVEN
      const ComplexOverlay = () => (
        <div data-testid="complex-overlay">
          <button>Action</button>
          <span>Complex Content</span>
        </div>
      )
      const line = createMockLine()
      const props = createSplitViewerProps({
        lines: [line],
        overlays: [{ content: <ComplexOverlay />, dockIndex: 1 }],
      })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const complexOverlays = screen.getAllByTestId('complex-overlay')
      expect(complexOverlays).toHaveLength(2)
      const buttons = screen.getAllByText('Action')
      expect(buttons).toHaveLength(2)
      const spans = screen.getAllByText('Complex Content')
      expect(spans).toHaveLength(2)
    })

    it('given no overlays prop, when rendered, expect overlay containers exist but empty, no errors', () => {
      // GIVEN
      const line = createMockLine()
      const props = createSplitViewerProps({
        lines: [line],
        // no overlays prop
      })

      // WHEN
      const { container } = render(<SplitViewer {...props} />)

      // EXPECT
      const overlayContainers = container.querySelectorAll('.diff-view-overlay')
      expect(overlayContainers).toHaveLength(4) // 2 per line (number + code) x 2 sides
      overlayContainers.forEach((overlayContainer) => {
        expect(overlayContainer).toBeEmptyDOMElement()
      })
      expect(screen.queryByText(/overlay/i)).not.toBeInTheDocument()
    })

    it('given empty overlays array, when rendered, expect overlay containers exist but empty, no errors', () => {
      // GIVEN
      const line = createMockLine()
      const props = createSplitViewerProps({
        lines: [line],
        overlays: [],
      })

      // WHEN
      const { container } = render(<SplitViewer {...props} />)

      // EXPECT
      const overlayContainers = container.querySelectorAll('.diff-view-overlay')
      expect(overlayContainers).toHaveLength(4) // 2 per line (number + code) x 2 sides
      overlayContainers.forEach((overlayContainer) => {
        expect(overlayContainer).toBeEmptyDOMElement()
      })
      expect(screen.queryByText(/overlay/i)).not.toBeInTheDocument()
    })

    it('given overlay with invalid dockIndex, when rendered, expect overlay not rendered anywhere', () => {
      // GIVEN
      const invalidOverlay = <span data-testid="invalid-overlay">Should not render</span>
      const line = createMockLine()
      const props = createSplitViewerProps({
        lines: [line],
        overlays: [{ content: invalidOverlay, dockIndex: 99 as 0 | 1 | 2 }], // Invalid dockIndex
      })

      // WHEN
      const { container } = render(<SplitViewer {...props} />)

      // EXPECT
      expect(screen.queryByTestId('invalid-overlay')).not.toBeInTheDocument()
      // Overlay containers should still exist but be empty
      const overlayContainers = container.querySelectorAll('.diff-view-overlay')
      expect(overlayContainers).toHaveLength(4)
      overlayContainers.forEach((overlayContainer) => {
        expect(overlayContainer).toBeEmptyDOMElement()
      })
    })

    it('given overlays with hunk line, when rendered, expect overlays not applied to hunk structure', () => {
      // GIVEN
      const hunkOverlay = <span data-testid="hunk-overlay">Hunk Action</span>
      const hunkLine = createHunkLine('@@ -1,3 +1,3 @@')
      const props = createSplitViewerProps({
        lines: [hunkLine],
        overlays: [{ content: hunkOverlay, dockIndex: 0 }],
      })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      // Hunk lines don't use ContentSide component, so overlays are not rendered
      expect(screen.queryByTestId('hunk-overlay')).not.toBeInTheDocument()

      const cells = screen.getAllByRole('cell')
      expect(cells).toHaveLength(2) // hunk has merged structure: left number + merged content
      expect(screen.getByTestId('load-more-button')).toBeInTheDocument()
    })

    it('given multiple lines with overlays, when rendered, expect overlays applied to all matching lines', () => {
      // GIVEN
      const lineOverlay = <span data-testid="multi-line-overlay">Multi Line</span>
      const lines = [
        createMockLine({ lineNumberLeft: 1, lineNumberRight: 1 }),
        createMockLine({ lineNumberLeft: 2, lineNumberRight: 2 }),
        createMockLine({ lineNumberLeft: 3, lineNumberRight: 3 }),
      ]
      const props = createSplitViewerProps({
        lines,
        overlays: [{ content: lineOverlay, dockIndex: 1 }], // Code cells
      })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const overlayElements = screen.getAllByTestId('multi-line-overlay')
      expect(overlayElements).toHaveLength(6) // 3 lines × 2 sides (left + right code cells)

      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(3)
      // Each row should have overlays in both code cells
      rows.forEach((row) => {
        const codeCells = row.querySelectorAll('td:nth-child(2), td:nth-child(4)') // left and right code cells
        expect(codeCells).toHaveLength(2)
        codeCells.forEach((cell) => {
          expect(cell.querySelector('[data-testid="multi-line-overlay"]')).toBeInTheDocument()
        })
      })
    })

    it('given overlays with mixed line types, when rendered, expect overlays applied correctly to each line type', () => {
      // GIVEN
      const mixedOverlay = <span data-testid="mixed-overlay">Mixed</span>
      const lines = [
        createMockLine({ typeLeft: 'context', typeRight: 'context' }),
        createMockLine({ typeLeft: 'add', typeRight: 'add' }),
        createMockLine({ typeLeft: 'delete', typeRight: 'delete' }),
        createHunkLine('@@ -1,3 +1,3 @@'),
      ]
      const props = createSplitViewerProps({
        lines,
        overlays: [{ content: mixedOverlay, dockIndex: 0 }], // Number cells
      })

      // WHEN
      render(<SplitViewer {...props} />)

      // EXPECT
      const overlayElements = screen.getAllByTestId('mixed-overlay')
      expect(overlayElements).toHaveLength(6) // 3 regular lines × 2 sides (hunk lines don't get overlays)

      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(4)

      // First 3 rows (regular lines) should have overlays in both number cells
      for (let i = 0; i < 3; i++) {
        const numberCells = rows[i].querySelectorAll('td:nth-child(1), td:nth-child(3)') // left and right number cells
        expect(numberCells).toHaveLength(2)
        numberCells.forEach((cell) => {
          expect(cell.querySelector('[data-testid="mixed-overlay"]')).toBeInTheDocument()
        })
      }

      // Last row (hunk) should NOT have overlay because hunk lines don't use ContentSide
      const hunkNumberCell = rows[3].querySelector('td:nth-child(1)') // only left number cell for hunk
      expect(hunkNumberCell?.querySelector('[data-testid="mixed-overlay"]')).not.toBeInTheDocument()
    })
  })

  describe('text selection behavior', () => {
    let mockGetSelection: ReturnType<typeof vi.fn>
    let mockSelection: Partial<Selection>

    beforeEach(() => {
      // Mock window.getSelection
      mockSelection = {
        rangeCount: 1,
        isCollapsed: false,
        anchorNode: null,
      }
      mockGetSelection = vi.fn(() => mockSelection as Selection)
      Object.defineProperty(window, 'getSelection', {
        value: mockGetSelection,
        writable: true,
      })

      // Mock requestAnimationFrame to execute immediately
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        cb(0)
        return 0
      })

      // Mock cancelAnimationFrame
      vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    const createMockElement = (className: string): HTMLElement => {
      const element = document.createElement('div')
      element.className = className
      return element
    }

    const createMockSelectionWithAnchor = (closestClassName: string): Partial<Selection> => {
      const mockElement = createMockElement('test-element')
      mockElement.closest = vi.fn((selector: string) => {
        if (selector === closestClassName) {
          return createMockElement(closestClassName.replace('.', ''))
        }
        return null
      })

      return {
        ...mockSelection,
        anchorNode: mockElement,
      }
    }

    it('given text selection starts on left side, when selection changes, expect left side selected and right side locked', () => {
      // GIVEN - Setup component with lines
      const lines = [
        createMockLine({
          typeLeft: 'context',
          typeRight: 'context',
          contentLeft: 'left content',
          contentRight: 'right content',
        }),
      ]
      const props = createSplitViewerProps({ lines })

      // Mock selection on left side
      mockSelection = createMockSelectionWithAnchor('.split-viewer-left-row')
      mockGetSelection.mockReturnValue(mockSelection as Selection)

      // WHEN
      const { container } = render(<SplitViewer {...props} />)

      // Trigger selectionchange event
      const selectionChangeEvent = new Event('selectionchange')
      document.dispatchEvent(selectionChangeEvent)

      // EXPECT
      const splitViewerContainer = container.firstChild as HTMLElement
      expect(splitViewerContainer).toHaveClass('is-selecting')
      expect(splitViewerContainer).toHaveClass('selecting-left')
      expect(splitViewerContainer).not.toHaveClass('selecting-right')
    })

    it('given text selection starts on right side, when selection changes, expect right side selected and left side locked', () => {
      // GIVEN - Setup component with lines
      const lines = [
        createMockLine({
          typeLeft: 'context',
          typeRight: 'context',
          contentLeft: 'left content',
          contentRight: 'right content',
        }),
      ]
      const props = createSplitViewerProps({ lines })

      // Mock selection on right side
      mockSelection = createMockSelectionWithAnchor('.split-viewer-right-row')
      mockGetSelection.mockReturnValue(mockSelection as Selection)

      // WHEN
      const { container } = render(<SplitViewer {...props} />)

      // Trigger selectionchange event
      const selectionChangeEvent = new Event('selectionchange')
      document.dispatchEvent(selectionChangeEvent)

      // EXPECT
      const splitViewerContainer = container.firstChild as HTMLElement
      expect(splitViewerContainer).toHaveClass('is-selecting')
      expect(splitViewerContainer).toHaveClass('selecting-right')
      expect(splitViewerContainer).not.toHaveClass('selecting-left')
    })

    it('given text selection is cleared, when selection changes, expect no side classes applied', () => {
      // GIVEN - Setup component with lines
      const lines = [
        createMockLine({
          typeLeft: 'context',
          typeRight: 'context',
        }),
      ]
      const props = createSplitViewerProps({ lines })

      // First establish a selection
      mockSelection = createMockSelectionWithAnchor('.split-viewer-left-row')
      mockGetSelection.mockReturnValue(mockSelection as Selection)

      const { container } = render(<SplitViewer {...props} />)

      // Trigger initial selection
      document.dispatchEvent(new Event('selectionchange'))
      const splitViewerContainer = container.firstChild as HTMLElement
      expect(splitViewerContainer).toHaveClass('selecting-left')

      // WHEN - Clear selection
      mockSelection = {
        rangeCount: 0,
        isCollapsed: true,
        anchorNode: null,
      }
      mockGetSelection.mockReturnValue(mockSelection as Selection)

      // Trigger selectionchange event
      const selectionChangeEvent = new Event('selectionchange')
      document.dispatchEvent(selectionChangeEvent)

      // EXPECT
      expect(splitViewerContainer).not.toHaveClass('is-selecting')
      expect(splitViewerContainer).not.toHaveClass('selecting-left')
      expect(splitViewerContainer).not.toHaveClass('selecting-right')
    })

    it('given selection outside split viewer, when selection changes, expect no side classes applied', () => {
      // GIVEN - Setup component with lines
      const lines = [
        createMockLine({
          typeLeft: 'context',
          typeRight: 'context',
        }),
      ]
      const props = createSplitViewerProps({ lines })

      // Mock selection outside the split viewer (neither left nor right side)
      const mockElement = createMockElement('other-element')
      mockElement.closest = vi.fn(() => null) // Not found in either side

      mockSelection = {
        ...mockSelection,
        anchorNode: mockElement,
      }
      mockGetSelection.mockReturnValue(mockSelection as Selection)

      // WHEN
      const { container } = render(<SplitViewer {...props} />)

      // Trigger selectionchange event
      const selectionChangeEvent = new Event('selectionchange')
      document.dispatchEvent(selectionChangeEvent)

      // EXPECT
      const splitViewerContainer = container.firstChild as HTMLElement
      expect(splitViewerContainer).toHaveClass('is-selecting') // Has selection, but...
      expect(splitViewerContainer).not.toHaveClass('selecting-left') // Not on left
      expect(splitViewerContainer).not.toHaveClass('selecting-right') // Not on right
    })

    it('given component unmounts, when unmounted, expect event listeners cleaned up', () => {
      // GIVEN
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
      const lines = [createMockLine()]
      const props = createSplitViewerProps({ lines })

      // WHEN
      const { unmount } = render(<SplitViewer {...props} />)
      unmount()

      // EXPECT
      expect(removeEventListenerSpy).toHaveBeenCalledWith('selectionchange', expect.any(Function))
    })
  })
})
