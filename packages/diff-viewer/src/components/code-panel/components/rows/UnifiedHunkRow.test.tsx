import { fireEvent, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPropsFactory } from '../../../../../../commons/src/test/generic-test-utils'
import { render } from '../../../../utils/test/render'
import { DiffLineViewModel } from '../../models/DiffLineViewModel'
import { DiffRowViewModel } from '../../models/DiffRowViewModel'
import type { HunkDirection, Widget } from '../viewers/types'
import { UnifiedHunkRow } from './UnifiedHunkRow'
import type { UnifiedHunkRowProps } from './types'

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
    overrides.highlightedContentLeft !== undefined ? overrides.highlightedContentLeft : '@@ -1,3 +1,3 @@',
    overrides.lineNumberLeft ?? null,
    overrides.typeRight ?? 'hunk',
    overrides.contentRight ?? '@@ -1,3 +1,3 @@',
    overrides.highlightedContentRight !== undefined ? overrides.highlightedContentRight : '@@ -1,3 +1,3 @@',
    overrides.lineNumberRight ?? null,
    overrides.hunkDirection ?? 'out',
  )
}

const createMockDiffRowViewModel = (
  overrides: Partial<{ line: DiffLineViewModel; widgets: Widget[] }> = {},
): DiffRowViewModel => {
  return new DiffRowViewModel(overrides.line ?? createMockDiffLineViewModel(), overrides.widgets ?? [])
}

const createUnifiedHunkRowProps = createPropsFactory<UnifiedHunkRowProps>({
  idx: 0,
  line: createMockDiffLineViewModel(),
  viewModel: createMockDiffRowViewModel(), // Keep default for most tests
  className: 'test-hunk-row',
  loadLines: vi.fn(),
  onMouseEnter: vi.fn(),
  onMouseLeave: vi.fn(),
  onRowSelectionStart: vi.fn(),
  onRowSelectionUpdate: vi.fn(),
  onRowSelectionEnd: vi.fn(),
  unified: true,
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

describe('UnifiedHunkRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('given basic props, when rendered, expect table row with correct structure', () => {
      // GIVEN
      const props = createUnifiedHunkRowProps()

      // WHEN
      render(<UnifiedHunkRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      expect(row).toBeInTheDocument()
      expect(row).toHaveAttribute('data-idx', '0')
      expect(row).toHaveClass('test-hunk-row')
    })

    it('given hunk line with direction, when rendered, expect LoadMoreButton with correct direction', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({ hunkDirection: 'down' })
      const props = createUnifiedHunkRowProps({ line })

      // WHEN
      render(<UnifiedHunkRow {...props} />)

      // EXPECT
      const button = screen.getByTestId('load-more-button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('data-direction', 'down')
    })

    it('given hunk line without direction, when rendered, expect LoadMoreButton with default direction', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({ hunkDirection: undefined })
      const props = createUnifiedHunkRowProps({ line })

      // WHEN
      render(<UnifiedHunkRow {...props} />)

      // EXPECT
      const button = screen.getByTestId('load-more-button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('data-direction', 'out')
    })

    it('given view model with content, when rendered, expect content displayed', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({
        highlightedContentLeft: '@@ -1,3 +1,3 @@',
      })
      const props = createUnifiedHunkRowProps({ line })

      // WHEN
      render(<UnifiedHunkRow {...props} />)

      // EXPECT
      expect(screen.getByText('@@ -1,3 +1,3 @@')).toBeInTheDocument()
    })

    it('given view model with empty content, when rendered, expect non-breaking space', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({ highlightedContentLeft: null })
      const viewModel = createMockDiffRowViewModel({ line })
      const props = createUnifiedHunkRowProps({ line, viewModel })

      // WHEN
      render(<UnifiedHunkRow {...props} />)

      // EXPECT
      const codeCell = screen.getAllByRole('cell')[1] // Second cell is the code cell
      expect(codeCell.innerHTML).toContain('&nbsp;')
    })
  })

  describe('interactions', () => {
    it('given LoadMoreButton clicked, when clicked, expect loadLines called with correct parameters', () => {
      // GIVEN
      const loadLines = vi.fn()
      const line = createMockDiffLineViewModel({ hunkDirection: 'up' })
      const props = createUnifiedHunkRowProps({ line, loadLines })

      // WHEN
      render(<UnifiedHunkRow {...props} />)
      const button = screen.getByTestId('load-more-button')
      button.click()

      // EXPECT
      expect(loadLines).toHaveBeenCalledWith(line, 'up')
    })

    it('given mouse enter event, when triggered, expect onMouseEnter called', () => {
      // GIVEN
      const onMouseEnter = vi.fn()
      const props = createUnifiedHunkRowProps({ onMouseEnter })

      // WHEN
      render(<UnifiedHunkRow {...props} />)
      const row = screen.getByRole('row')
      fireEvent.mouseEnter(row)

      // EXPECT
      expect(onMouseEnter).toHaveBeenCalled()
    })

    it('given mouse leave event, when triggered, expect onMouseLeave called', () => {
      // GIVEN
      const onMouseLeave = vi.fn()
      const props = createUnifiedHunkRowProps({ onMouseLeave })

      // WHEN
      render(<UnifiedHunkRow {...props} />)
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
        const props = createUnifiedHunkRowProps({ line })

        // WHEN
        render(<UnifiedHunkRow {...props} />)

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
      const props = createUnifiedHunkRowProps({ loadLines: undefined })

      // WHEN
      render(<UnifiedHunkRow {...props} />)
      const button = screen.getByTestId('load-more-button')

      // EXPECT
      expect(() => button.click()).not.toThrow()
    })

    it('given no mouse event handlers, when events triggered, expect no error thrown', () => {
      // GIVEN
      const props = createUnifiedHunkRowProps({
        onMouseEnter: undefined,
        onMouseLeave: undefined,
      })

      // WHEN
      render(<UnifiedHunkRow {...props} />)
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
      })
      const viewModel = createMockDiffRowViewModel({ line })
      const props = createUnifiedHunkRowProps({ line, viewModel })

      // WHEN
      render(<UnifiedHunkRow {...props} />)

      // EXPECT
      const codeCell = screen.getAllByRole('cell')[1] // Second cell is the code cell
      expect(codeCell.innerHTML).toContain('<span class="css-0"> </span><span></span>')
    })

    it('given whitespace-only content, when rendered, expect content preserved', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({
        highlightedContentLeft: '   ',
      })
      const viewModel = createMockDiffRowViewModel({ line })
      const props = createUnifiedHunkRowProps({ line, viewModel })

      // WHEN
      render(<UnifiedHunkRow {...props} />)

      // EXPECT
      const codeCell = screen.getAllByRole('cell')[1] // Second cell is the code cell
      expect(codeCell.innerHTML).toContain('   ')
    })
  })

  describe('accessibility', () => {
    it('given row rendered, when inspected, expect proper table structure', () => {
      // GIVEN
      const props = createUnifiedHunkRowProps()

      // WHEN
      render(<UnifiedHunkRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      const cells = screen.getAllByRole('cell')
      expect(row).toBeInTheDocument()
      expect(cells).toHaveLength(2) // left number cell (colspan=2), code cell
    })

    it('given row rendered, when inspected, expect left number cell spans 2 columns', () => {
      // GIVEN
      const props = createUnifiedHunkRowProps()

      // WHEN
      render(<UnifiedHunkRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      const leftCell = row.querySelector('td[colspan="2"]')
      expect(leftCell).toBeInTheDocument()
    })

    it('given LoadMoreButton rendered, when inspected, expect button is accessible', () => {
      // GIVEN
      const props = createUnifiedHunkRowProps()

      // WHEN
      render(<UnifiedHunkRow {...props} />)

      // EXPECT
      const button = screen.getByTestId('load-more-button')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('DIV')
    })
  })
})
