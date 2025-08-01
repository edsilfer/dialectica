import { ThemeProvider, Themes } from '@edsilfer/commons'
import { createPropsFactory, render as baseRender } from '@edsilfer/test-lib'
import { fireEvent, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Widget } from '../../../../models/LineExtensions'
import { LineMetadata } from '../../models/LineMetadata'
import { Row } from '../../models/Row'
import type { HunkDirection } from '../../models/types'
import { BaseRowProps } from './DiffRow'
import { HunkRow } from './HunkRow'

const renderWithTheme = (ui: React.ReactElement) => {
  return baseRender(
    <ThemeProvider theme={Themes.light}>
      <table>
        <tbody>{ui}</tbody>
      </table>
    </ThemeProvider>,
  )
}

// MOCKS
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
const createMockDiffLineViewModel = (overrides: Partial<LineMetadata> = {}): LineMetadata => {
  return new LineMetadata(
    overrides.typeLeft ?? 'hunk',
    overrides.contentLeft ?? '@@ -1,3 +1,3 @@',
    overrides.lineNumberLeft ?? null,
    overrides.typeRight ?? 'hunk',
    overrides.contentRight ?? '@@ -1,3 +1,3 @@',
    overrides.lineNumberRight ?? null,
    overrides.language ?? 'typescript',
    overrides.hunkDirection ?? 'out',
  )
}

const createMockDiffRowViewModel = (overrides: Partial<{ line: LineMetadata; widgets: Widget[] }> = {}): Row => {
  return new Row(overrides.line ?? createMockDiffLineViewModel(), overrides.widgets ?? [])
}

const createHunkRowProps = createPropsFactory<{ flavor: 'split' | 'unified' } & BaseRowProps>({
  idx: 0,
  line: createMockDiffLineViewModel(),
  viewModel: createMockDiffRowViewModel(),
  className: 'test-hunk-row',
  flavor: 'split',
  overlays: {},
  widgets: [],
  loadLines: vi.fn(),
  onMouseEnter: vi.fn(),
  onMouseLeave: vi.fn(),
  onRowSelectionStart: vi.fn(),
  onRowSelectionUpdate: vi.fn(),
  onRowSelectionEnd: vi.fn(),
  isHunk: true,
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

describe('HunkRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('given basic props, when rendered, expect table row with correct structure', () => {
      // GIVEN
      const props = createHunkRowProps()

      // WHEN
      renderWithTheme(<HunkRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      expect(row).toBeInTheDocument()
      expect(row).toHaveAttribute('data-idx', '0')
      expect(row).toHaveClass('test-hunk-row')
    })

    it('given hunk line with direction, when rendered, expect LoadMoreButton with correct direction', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({ hunkDirection: 'up' })
      const props = createHunkRowProps({ line })

      // WHEN
      renderWithTheme(<HunkRow {...props} />)

      // EXPECT
      const button = screen.getByTestId('load-more-button')
      expect(button).toBeInTheDocument()
    })

    it('given hunk line without direction, when rendered, expect LoadMoreButton with default direction', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({ hunkDirection: undefined })
      const props = createHunkRowProps({ line })

      // WHEN
      renderWithTheme(<HunkRow {...props} />)

      // EXPECT
      const button = screen.getByTestId('load-more-button')
      expect(button).toBeInTheDocument()
    })

    it('given view model with content, when rendered, expect content displayed', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({
        contentLeft: '@@ -1,3 +1,3 @@',
      })
      const props = createHunkRowProps({ line })

      // WHEN
      renderWithTheme(<HunkRow {...props} />)

      // EXPECT
      expect(screen.getByText('@@ -1,3 +1,3 @@')).toBeInTheDocument()
    })
  })

  describe('column spanning', () => {
    it('given split view flavor, when rendered, expect correct column spans', () => {
      // GIVEN
      const props = createHunkRowProps({ flavor: 'split' })

      // WHEN
      renderWithTheme(<HunkRow {...props} />)

      // EXPECT
      const cells = screen.getAllByRole('cell')
      expect(cells).toHaveLength(2)
      // Split view: left number cell spans 1, code cell spans 3
      expect(cells[0]).toHaveAttribute('colspan', '1')
      expect(cells[1]).toHaveAttribute('colspan', '3')
    })

    it('given unified view flavor, when rendered, expect correct column spans', () => {
      // GIVEN
      const props = createHunkRowProps({ flavor: 'unified' })

      // WHEN
      renderWithTheme(<HunkRow {...props} />)

      // EXPECT
      const cells = screen.getAllByRole('cell')
      expect(cells).toHaveLength(2)
      // Unified view: left number cell spans 2, code cell spans 1
      expect(cells[0]).toHaveAttribute('colspan', '2')
      expect(cells[1]).toHaveAttribute('colspan', '1')
    })
  })

  describe('interactions', () => {
    it('given LoadMoreButton clicked, when clicked, expect loadLines called with correct parameters', () => {
      // GIVEN
      const loadLines = vi.fn()
      const line = createMockDiffLineViewModel({ hunkDirection: 'up' })
      const props = createHunkRowProps({ line, loadLines })

      // WHEN
      renderWithTheme(<HunkRow {...props} />)
      const button = screen.getByTestId('load-more-button')
      button.click()

      // EXPECT
      expect(loadLines).toHaveBeenCalledWith(line, 'up')
    })

    it('given mouse enter event, when triggered, expect onMouseEnter called', () => {
      // GIVEN
      const onMouseEnter = vi.fn()
      const props = createHunkRowProps({ onMouseEnter })

      // WHEN
      renderWithTheme(<HunkRow {...props} />)
      const row = screen.getByRole('row')
      fireEvent.mouseEnter(row)

      // EXPECT
      expect(onMouseEnter).toHaveBeenCalled()
    })

    it('given mouse leave event, when triggered, expect onMouseLeave called', () => {
      // GIVEN
      const onMouseLeave = vi.fn()
      const props = createHunkRowProps({ onMouseLeave })

      // WHEN
      renderWithTheme(<HunkRow {...props} />)
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
        const props = createHunkRowProps({ line })

        // WHEN
        renderWithTheme(<HunkRow {...props} />)

        // EXPECT
        if (direction === 'in') {
          const down = screen.getByTestId('load-more-button-down')
          const up = screen.getByTestId('load-more-button-up')
          expect(down).toBeInTheDocument()
          expect(up).toBeInTheDocument()
        } else if (direction === 'in_up') {
          const up = screen.getByTestId('load-more-button-up')
          expect(up).toBeInTheDocument()
        } else if (direction === 'in_down') {
          const down = screen.getByTestId('load-more-button-down')
          expect(down).toBeInTheDocument()
        } else {
          const button = screen.getByTestId('load-more-button')
          expect(button).toBeInTheDocument()
        }
      },
    )
  })

  describe('edge cases', () => {
    it('given no loadLines function, when LoadMoreButton clicked, expect no error thrown', () => {
      // GIVEN
      const props = createHunkRowProps({ loadLines: undefined })

      // WHEN
      renderWithTheme(<HunkRow {...props} />)
      const button = screen.getByTestId('load-more-button')

      // EXPECT
      expect(() => button.click()).not.toThrow()
    })

    it('given no mouse event handlers, when events triggered, expect no error thrown', () => {
      // GIVEN
      const props = createHunkRowProps({
        onMouseEnter: undefined,
        onMouseLeave: undefined,
      })

      // WHEN
      renderWithTheme(<HunkRow {...props} />)
      const row = screen.getByRole('row')

      // EXPECT
      expect(() => {
        fireEvent.mouseEnter(row)
        fireEvent.mouseLeave(row)
      }).not.toThrow()
    })
  })

  describe('accessibility', () => {
    it('given row rendered, when inspected, expect proper table structure', () => {
      // GIVEN
      const props = createHunkRowProps()

      // WHEN
      renderWithTheme(<HunkRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      const cells = screen.getAllByRole('cell')
      expect(row).toBeInTheDocument()
      expect(cells).toHaveLength(2)
    })

    it('given LoadMoreButton rendered, when inspected, expect button is accessible', () => {
      // GIVEN
      const props = createHunkRowProps()

      // WHEN
      renderWithTheme(<HunkRow {...props} />)

      // EXPECT
      const button = screen.getByTestId('load-more-button')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('DIV')
    })
  })
})
