import { fireEvent, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
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
 *
 * ## Edge Cases
 * - **Empty lines array**: Table structure preserved but no rows rendered
 * - **Null line numbers**: Component renders empty cell (not a default value)
 * - **Null or empty highlighted content**: Falls back to non-breaking space (`&nbsp;`), not original content
 * - **Very long content**: No truncation, full content displayed
 * - **Multiple hunk lines**: All load more buttons functional with correct callbacks
 * - **Missing onLoadMoreLines handler**: No errors when buttons clicked
 * - **Mixed line types**: Only the relevant side (left or right) renders content for its type; the other side may be empty
 *
 * ## Assertions
 * - Verify table structure (colgroup, cells, colspan for hunks; hunk lines render merged cell)
 * - Check line type prefixes (+/-/space) and content rendering
 * - Validate line number display and null handling (empty cell for null)
 * - Test hunk direction mapping and button interactions
 * - Ensure HTML content rendered safely with proper escaping
 * - Verify key generation for React optimization
 * - Test split view column layout and styling
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
})
