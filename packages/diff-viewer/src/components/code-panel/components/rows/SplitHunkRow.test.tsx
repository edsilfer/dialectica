import { fireEvent, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPropsFactory } from '../../../../../../commons/src/test/generic-test-utils'
import { render } from '../../../../utils/test/render'
import { DiffLineViewModel } from '../../models/DiffLineViewModel'
import { DiffRowViewModel } from '../../models/DiffRowViewModel'
import type { HunkDirection } from '../viewers/types'
import { SplitHunkRow } from './SplitHunkRow'
import type { SplitHunkRowProps } from './types'
import type { Widget } from '../viewers/types'

// MOCKS
vi.mock('../../../ui/buttons/LoadMoreButton', () => ({
  default: vi.fn(
    ({
      direction,
      onClick,
    }: {
      direction: HunkDirection
      onClick?: (e: React.MouseEvent, direction: HunkDirection) => void
    }) => (
      <div data-testid="load-more-button" data-direction={direction} onClick={(e) => onClick?.(e, direction)}>
        Load More {direction}
      </div>
    ),
  ),
}))

// Mock the LoadMoreLines icon component
vi.mock('../../../ui/icons/LoadMoreLines', () => ({
  default: vi.fn(({ direction }: { direction: HunkDirection }) => (
    <svg data-testid="load-more-icon" data-direction={direction}>
      Load More Icon {direction}
    </svg>
  )),
}))

vi.mock('../viewers/shared-styles', () => ({
  getViewerStyles: vi.fn(() => ({
    row: { color: '#24292f' },
    hunkRow: { height: '1.5rem !important' },
    leftNumberCell: {
      hunk: [{ textAlign: 'center', userSelect: 'none' }],
    },
    codeCell: {
      hunk: [{ textAlign: 'left', padding: '0 8px', background: '#f6f8fa' }],
    },
  })),
}))

// HELPERS
const createMockDiffLineViewModel = (overrides: Partial<DiffLineViewModel> = {}): DiffLineViewModel => {
  return new DiffLineViewModel(
    overrides.typeLeft ?? 'hunk',
    overrides.contentLeft ?? '@@ -1,3 +1,3 @@',
    overrides.highlightedContentLeft ?? '@@ -1,3 +1,3 @@',
    overrides.lineNumberLeft ?? null,
    overrides.typeRight ?? 'hunk',
    overrides.contentRight ?? '@@ -1,3 +1,3 @@',
    overrides.highlightedContentRight ?? '@@ -1,3 +1,3 @@',
    overrides.lineNumberRight ?? null,
    overrides.hunkDirection ?? 'out',
  )
}

const createMockDiffRowViewModel = (
  overrides: Partial<{ line: DiffLineViewModel; widgets: Widget[] }> = {},
): DiffRowViewModel => {
  return new DiffRowViewModel(overrides.line ?? createMockDiffLineViewModel(), overrides.widgets ?? [])
}

const createSplitHunkRowProps = createPropsFactory<SplitHunkRowProps>({
  idx: 0,
  line: createMockDiffLineViewModel(),
  viewModel: createMockDiffRowViewModel(),
  className: 'test-hunk-row',
  loadLines: vi.fn(),
  onMouseEnter: vi.fn(),
  onMouseLeave: vi.fn(),
  onRowSelectionStart: vi.fn(),
  onRowSelectionUpdate: vi.fn(),
  onRowSelectionEnd: vi.fn(),
})

// TEST DATA
const HUNK_DIRECTION_TEST_CASES: Array<{
  direction: HunkDirection
  description: string
}> = [
  { direction: 'up', description: 'up direction' },
  { direction: 'down', description: 'down direction' },
  { direction: 'out', description: 'out direction' },
  { direction: 'in', description: 'in direction' },
  { direction: 'in_up', description: 'in_up direction' },
  { direction: 'in_down', description: 'in_down direction' },
]

describe('SplitHunkRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('given basic props, when rendered, expect table row with correct structure', () => {
      // GIVEN
      const props = createSplitHunkRowProps()

      // WHEN
      render(<SplitHunkRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      expect(row).toBeInTheDocument()
      expect(row).toHaveAttribute('data-idx', '0')
      expect(row).toHaveClass('test-hunk-row')
    })

    it('given hunk line with direction, when rendered, expect LoadMoreButton with correct direction', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({ hunkDirection: 'up' })
      const props = createSplitHunkRowProps({ line })

      // WHEN
      render(<SplitHunkRow {...props} />)

      // EXPECT
      const button = screen.getByTestId('load-more-button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('data-direction', 'up')
    })

    it('given hunk line without direction, when rendered, expect LoadMoreButton with default direction', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({ hunkDirection: undefined })
      const props = createSplitHunkRowProps({ line })

      // WHEN
      render(<SplitHunkRow {...props} />)

      // EXPECT
      const button = screen.getByTestId('load-more-button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('data-direction', 'out')
    })

    it('given hunk content, when rendered, expect content displayed in merged cell', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({
        highlightedContentLeft: '@@ -1,3 +1,3 @@',
        highlightedContentRight: '@@ -1,3 +1,3 @@',
      })
      const props = createSplitHunkRowProps({ line })

      // WHEN
      render(<SplitHunkRow {...props} />)

      // EXPECT
      const cells = screen.getAllByRole('cell')
      expect(cells).toHaveLength(2)
      expect(cells[1]).toHaveAttribute('colspan', '3')
    })

    it('given line with only left content, when rendered, expect left content displayed', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({
        highlightedContentLeft: 'Left content only',
        highlightedContentRight: null,
      })
      const props = createSplitHunkRowProps({ line })

      // WHEN
      render(<SplitHunkRow {...props} />)

      // EXPECT
      expect(screen.getByText('Left content only')).toBeInTheDocument()
    })

    it('given line with only right content, when rendered, expect fallback content displayed', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({
        highlightedContentLeft: null,
        highlightedContentRight: 'Right content only',
      })
      const props = createSplitHunkRowProps({ line })

      // WHEN
      render(<SplitHunkRow {...props} />)

      // EXPECT
      const codeCell = screen.getAllByRole('cell')[1]
      expect(codeCell.innerHTML).toContain('@@ -1,3 +1,3 @@')
    })

    it('given line with no content, when rendered, expect fallback content displayed', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({
        highlightedContentLeft: null,
        highlightedContentRight: null,
      })
      const props = createSplitHunkRowProps({ line })

      // WHEN
      render(<SplitHunkRow {...props} />)

      // EXPECT
      const codeCell = screen.getAllByRole('cell')[1]
      // The fallback is the default mock content
      expect(codeCell.innerHTML).toContain('@@ -1,3 +1,3 @@')
    })
  })

  describe('interactions', () => {
    it('given LoadMoreButton clicked, when clicked, expect loadLines called with correct parameters', () => {
      // GIVEN
      const loadLines = vi.fn()
      const line = createMockDiffLineViewModel({ hunkDirection: 'up' })
      const props = createSplitHunkRowProps({ line, loadLines })

      // WHEN
      render(<SplitHunkRow {...props} />)
      const button = screen.getByTestId('load-more-button')
      button.click()

      // EXPECT
      expect(loadLines).toHaveBeenCalledWith(line, 'up')
    })

    it('given mouse enter event, when triggered, expect onMouseEnter called', () => {
      // GIVEN
      const onMouseEnter = vi.fn()
      const props = createSplitHunkRowProps({ onMouseEnter })

      // WHEN
      render(<SplitHunkRow {...props} />)
      const row = screen.getByRole('row')
      fireEvent.mouseEnter(row)

      // EXPECT
      expect(onMouseEnter).toHaveBeenCalled()
    })

    it('given mouse leave event, when triggered, expect onMouseLeave called', () => {
      // GIVEN
      const onMouseLeave = vi.fn()
      const props = createSplitHunkRowProps({ onMouseLeave })

      // WHEN
      render(<SplitHunkRow {...props} />)
      const row = screen.getByRole('row')
      fireEvent.mouseLeave(row)

      // EXPECT
      expect(onMouseLeave).toHaveBeenCalled()
    })
  })

  describe('hunk direction variations', () => {
    it.each(HUNK_DIRECTION_TEST_CASES)(
      'given $description, when rendered, expect LoadMoreButton with correct direction',
      ({ direction }) => {
        // GIVEN
        const line = createMockDiffLineViewModel({ hunkDirection: direction })
        const props = createSplitHunkRowProps({ line })

        // WHEN
        render(<SplitHunkRow {...props} />)

        // EXPECT
        const button = screen.getByTestId('load-more-button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveAttribute('data-direction', direction)
      },
    )
  })

  describe('edge cases', () => {
    it('given no loadLines function, when LoadMoreButton clicked, expect no error thrown', () => {
      // GIVEN
      const props = createSplitHunkRowProps({ loadLines: undefined })

      // WHEN
      render(<SplitHunkRow {...props} />)
      const button = screen.getByTestId('load-more-button')

      // EXPECT
      expect(() => button.click()).not.toThrow()
    })

    it('given no mouse event handlers, when events triggered, expect no error thrown', () => {
      // GIVEN
      const props = createSplitHunkRowProps({
        onMouseEnter: undefined,
        onMouseLeave: undefined,
      })

      // WHEN
      render(<SplitHunkRow {...props} />)
      const row = screen.getByRole('row')

      // EXPECT
      expect(() => {
        fireEvent.mouseEnter(row)
        fireEvent.mouseLeave(row)
      }).not.toThrow()
    })

    it('given empty content strings, when rendered, expect empty string displayed', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({
        highlightedContentLeft: '',
        highlightedContentRight: '',
      })
      const props = createSplitHunkRowProps({ line })

      // WHEN
      render(<SplitHunkRow {...props} />)

      // EXPECT
      const codeCell = screen.getAllByRole('cell')[1]
      expect(codeCell.innerHTML).toContain('<span class="css-0"> </span><span></span>')
    })

    it('given whitespace-only content, when rendered, expect content preserved', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({
        highlightedContentLeft: '   ',
        highlightedContentRight: null,
      })
      const props = createSplitHunkRowProps({ line })

      // WHEN
      render(<SplitHunkRow {...props} />)

      // EXPECT
      const codeCell = screen.getAllByRole('cell')[1]
      expect(codeCell.innerHTML).toContain('   ')
    })
  })

  describe('accessibility', () => {
    it('given row rendered, when inspected, expect proper table structure', () => {
      // GIVEN
      const props = createSplitHunkRowProps()

      // WHEN
      render(<SplitHunkRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      const cells = screen.getAllByRole('cell')
      expect(row).toBeInTheDocument()
      expect(cells).toHaveLength(2)
    })

    it('given LoadMoreButton rendered, when inspected, expect button is accessible', () => {
      // GIVEN
      const props = createSplitHunkRowProps()

      // WHEN
      render(<SplitHunkRow {...props} />)

      // EXPECT
      const button = screen.getByTestId('load-more-button')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('DIV')
    })
  })
})
