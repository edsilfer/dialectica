import { fireEvent, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createPropsFactory } from '../../../utils/test/generic-test-utils'
import { expectClickHandlerToBeCalled } from '../../../utils/test/components/ui/buttons/test-utils'
import { render } from '../../../utils/test/render'
import { DiffLineViewModel } from '../models/DiffLineViewModel'
import DiffCell from './DiffCell'
import type { DiffLineType, HunkDirection } from './types'

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

const createDiffCellProps = createPropsFactory<{
  line: DiffLineViewModel
  side: 'left' | 'right' | 'unified'
  lineType: DiffLineType
  isHunk: boolean
  overlayGroups: Record<number, React.ReactNode[]>
  className?: string
  numberCellStyle?: React.CSSProperties
  onLoadMoreLines?: (line: DiffLineViewModel, direction: HunkDirection) => void
  unified?: boolean
}>({
  line: new DiffLineViewModel(
    'context',
    'test line',
    '<span>test line</span>',
    1,
    'context',
    'test line',
    '<span>test line</span>',
    1,
  ),
  side: 'left',
  lineType: 'context',
  isHunk: false,
  overlayGroups: {},
  className: undefined,
  numberCellStyle: undefined,
  onLoadMoreLines: undefined,
  unified: false,
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
    hunkDirection: undefined as HunkDirection | undefined,
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

// Wrap DiffCell in a minimal table for rendering
const renderDiffCell = (props: ReturnType<typeof createDiffCellProps>) =>
  render(
    <table>
      <tbody>
        <tr>
          <DiffCell {...props} />
        </tr>
      </tbody>
    </table>,
  )

// Shared assertions
const expectSplitView = (number: string, content: string, prefix: string) => {
  const cells = screen.getAllByRole('cell')
  expect(cells).toHaveLength(2)
  if (number === '') {
    // For hunk lines, the number cell contains LoadMoreButton, not empty content
    expect(cells[0]).toContainElement(screen.getByTestId('load-more-button'))
  } else {
    expect(cells[0]).toHaveTextContent(number)
  }
  expect(cells[1]).toHaveTextContent(content)
  // Prefix is rendered in a separate span, so we check for the span content
  const prefixSpan = cells[1].querySelector('[style*="user-select: none"]')
  expect(prefixSpan).toBeInTheDocument()
  if (prefixSpan) {
    if (prefix === ' ') {
      expect(prefixSpan.innerHTML).toBe(' ')
    } else {
      expect(prefixSpan.innerHTML).toBe(prefix)
    }
  }
}

const expectUnifiedView = (leftNumber: string | null, rightNumber: string | null, content: string, prefix = ' ') => {
  const cells = screen.getAllByRole('cell')
  expect(cells).toHaveLength(3)
  if (leftNumber) expect(cells[0]).toHaveTextContent(leftNumber)
  if (rightNumber) expect(cells[1]).toHaveTextContent(rightNumber)
  expect(cells[2]).toHaveTextContent(content)
  // Prefix is rendered in a separate span, so we check for the span content
  // In unified view, the prefix span uses CSS classes instead of inline styles
  const prefixSpan = cells[2].querySelector('span:first-child')
  expect(prefixSpan).toBeInTheDocument()
  if (prefixSpan) {
    if (prefix === ' ') {
      expect(prefixSpan.innerHTML).toBe(' ')
    } else {
      expect(prefixSpan.innerHTML).toBe(prefix)
    }
  }
}

// -----------------------------------------------------------------------------
// TESTS
// -----------------------------------------------------------------------------
describe('DiffCell', () => {
  // Debug test to see what's in the prefix span
  it('debug: check prefix span content', () => {
    const props = createDiffCellProps({
      line: createMockLine({
        typeLeft: 'context',
        contentLeft: 'context line',
        highlightedContentLeft: '<span>context line</span>',
        lineNumberLeft: 5,
      }),
      side: 'left',
      lineType: 'context',
    })

    renderDiffCell(props)

    const cells = screen.getAllByRole('cell')
    const prefixSpan = cells[1].querySelector('[style*="user-select: none"]')
    console.log('Prefix span:', prefixSpan)
    console.log('Prefix span innerHTML:', prefixSpan?.innerHTML)
    console.log('Prefix span textContent:', prefixSpan?.textContent)
    console.log('Prefix span innerText:', (prefixSpan as HTMLElement)?.innerText)
    console.log('Prefix span nodeValue:', prefixSpan?.firstChild?.nodeValue)

    // Also check all spans
    const allSpans = cells[1].querySelectorAll('span')
    console.log(
      'All spans:',
      Array.from(allSpans).map((span) => ({
        textContent: span.textContent,
        innerHTML: span.innerHTML,
        style: span.getAttribute('style'),
      })),
    )
  })

  // -------------------------------------------------------------------------
  // Split view – happy‑path matrix
  // -------------------------------------------------------------------------
  describe.each([
    {
      name: 'context line (left)',
      props: createDiffCellProps({
        line: createMockLine({
          typeLeft: 'context',
          contentLeft: 'context line',
          highlightedContentLeft: '<span>context line</span>',
          lineNumberLeft: 5,
        }),
        side: 'left',
        lineType: 'context',
      }),
      expectedNumber: '5',
      expectedContent: 'context line',
      expectedPrefix: ' ',
    },
    {
      name: 'add line (right)',
      props: createDiffCellProps({
        line: createMockLine({
          typeRight: 'add',
          contentRight: 'added line',
          highlightedContentRight: '<span>added line</span>',
          lineNumberRight: 10,
        }),
        side: 'right',
        lineType: 'add',
      }),
      expectedNumber: '10',
      expectedContent: 'added line',
      expectedPrefix: '+',
    },
    {
      name: 'delete line (left)',
      props: createDiffCellProps({
        line: createMockLine({
          typeLeft: 'delete',
          contentLeft: 'deleted line',
          highlightedContentLeft: '<span>deleted line</span>',
          lineNumberLeft: 15,
        }),
        side: 'left',
        lineType: 'delete',
      }),
      expectedNumber: '15',
      expectedContent: 'deleted line',
      expectedPrefix: '-',
    },
  ])('split view rendering — $name', ({ props, expectedNumber, expectedContent, expectedPrefix }) => {
    it('renders number, content and prefix correctly', () => {
      renderDiffCell(props)
      expectSplitView(expectedNumber, expectedContent, expectedPrefix)
    })
  })

  // -------------------------------------------------------------------------
  // Split view – hunk + edge cases
  // -------------------------------------------------------------------------
  it('renders hunk line with LoadMoreButton', () => {
    const mockHandler = vi.fn()
    const props = createDiffCellProps({
      line: createHunkLine('@@ -1,3 +1,3 @@', 'out'),
      side: 'left',
      lineType: 'hunk',
      isHunk: true,
      onLoadMoreLines: mockHandler,
    })

    renderDiffCell(props)

    expect(screen.getByTestId('load-more-button')).toBeInTheDocument()
    expect(screen.getByText('Load More out')).toBeInTheDocument()
    expectSplitView('', '@@ -1,3 +1,3 @@', ' ')
  })

  it('invokes onLoadMoreLines callback with correct direction', () => {
    const mockHandler = vi.fn()
    const props = createDiffCellProps({
      line: createHunkLine('@@ -1,3 +1,3 @@', 'down'),
      side: 'left',
      lineType: 'hunk',
      isHunk: true,
      onLoadMoreLines: mockHandler,
    })

    renderDiffCell(props)
    fireEvent.click(screen.getByTestId('load-more-button'))

    expectClickHandlerToBeCalled(mockHandler, 1)
    expect(mockHandler).toHaveBeenCalledWith(expect.any(Object), 'down')
  })

  it('renders empty number cell when lineNumber is null', () => {
    const props = createDiffCellProps({
      line: new DiffLineViewModel(
        'context',
        'test line left',
        '<span>test line left</span>',
        null,
        'context',
        'test line right',
        '<span>test line right</span>',
        1,
      ),
      side: 'left',
      lineType: 'context',
    })

    renderDiffCell(props)

    const [numberCell] = screen.getAllByRole('cell')
    expect(numberCell).toHaveTextContent('')
  })

  it('falls back to &nbsp; when highlightedContent is null', () => {
    const props = createDiffCellProps({
      line: new DiffLineViewModel(
        'context',
        'test line left',
        null,
        1,
        'context',
        'test line right',
        '<span>test line right</span>',
        1,
      ),
      side: 'left',
      lineType: 'context',
    })

    renderDiffCell(props)

    const [, codeCell] = screen.getAllByRole('cell')
    expect(codeCell.innerHTML).toContain('&nbsp;')
  })

  it('applies custom className and numberCellStyle', () => {
    const props = createDiffCellProps({
      line: createMockLine(),
      side: 'left',
      lineType: 'context',
      className: 'custom-class',
      numberCellStyle: { backgroundColor: 'red' },
    })

    renderDiffCell(props)

    const [numberCell, codeCell] = screen.getAllByRole('cell')
    expect(numberCell).toHaveClass('custom-class')
    expect(numberCell).toHaveStyle('background-color: rgb(255, 0, 0)')
    expect(codeCell).toHaveClass('custom-class')
  })

  // -------------------------------------------------------------------------
  // Unified view
  // -------------------------------------------------------------------------
  it('renders unified view line correctly', () => {
    const props = createDiffCellProps({
      line: new DiffLineViewModel(
        'context',
        'test left',
        '<span>test left</span>',
        5,
        'context',
        'unified content',
        '<span>unified content</span>',
        10,
      ),
      side: 'unified',
      lineType: 'context',
      unified: true,
    })

    renderDiffCell(props)

    expectUnifiedView('5', '10', 'unified content')
  })

  it('renders unified hunk line with colspan', () => {
    const props = createDiffCellProps({
      line: createHunkLine('@@ -1,3 +1,3 @@', 'out'),
      side: 'unified',
      lineType: 'hunk',
      isHunk: true,
      unified: true,
    })

    renderDiffCell(props)

    const cells = screen.getAllByRole('cell')
    expect(cells).toHaveLength(2)
    expect(cells[0]).toHaveAttribute('colspan', '2')
    expect(screen.getByTestId('load-more-button')).toBeInTheDocument()
  })

  it.each([
    { lineType: 'add', expectedPrefix: '+' },
    { lineType: 'delete', expectedPrefix: '-' },
    { lineType: 'context', expectedPrefix: ' ' },
    { lineType: 'hunk', expectedPrefix: ' ' },
    { lineType: 'empty', expectedPrefix: ' ' },
  ] as Array<{ lineType: DiffLineType; expectedPrefix: string }>)(
    'renders correct prefix for $lineType (unified view)',
    ({ lineType, expectedPrefix }) => {
      const props = createDiffCellProps({
        line: new DiffLineViewModel(
          lineType,
          'left',
          '<span>left</span>',
          1,
          lineType,
          'right',
          '<span>right</span>',
          1,
        ),
        side: 'unified',
        lineType,
        unified: true,
      })

      renderDiffCell(props)

      expectUnifiedView('1', '1', 'right', expectedPrefix)
    },
  )

  // -------------------------------------------------------------------------
  // Overlay groups
  // -------------------------------------------------------------------------
  it('renders overlays in split view', () => {
    const props = createDiffCellProps({
      line: createMockLine(),
      side: 'left',
      lineType: 'context',
      overlayGroups: {
        0: [
          <span key="l" data-testid="o1">
            O1
          </span>,
        ],
        1: [
          <span key="r" data-testid="o2">
            O2
          </span>,
        ],
      },
    })

    renderDiffCell(props)

    expect(screen.getByTestId('o1')).toBeInTheDocument()
    expect(screen.getByTestId('o2')).toBeInTheDocument()
  })

  it('renders overlays in unified view', () => {
    const props = createDiffCellProps({
      line: createMockLine(),
      side: 'unified',
      lineType: 'context',
      unified: true,
      overlayGroups: {
        0: [
          <span key="l" data-testid="l">
            L
          </span>,
        ],
        1: [
          <span key="r" data-testid="r">
            R
          </span>,
        ],
        2: [
          <span key="c" data-testid="c">
            C
          </span>,
        ],
      },
    })

    renderDiffCell(props)

    expect(screen.getByTestId('l')).toBeInTheDocument()
    expect(screen.getByTestId('r')).toBeInTheDocument()
    expect(screen.getByTestId('c')).toBeInTheDocument()
  })

  it('renders empty overlay containers when overlayGroups is empty', () => {
    renderDiffCell(
      createDiffCellProps({
        line: createMockLine(),
        side: 'left',
        lineType: 'context',
        overlayGroups: {},
      }),
    )

    screen.getAllByRole('cell').forEach((cell) => {
      const overlay = cell.querySelector('.diff-view-overlay')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toBeEmptyDOMElement()
    })
  })

  it('renders multiple overlays in the same container', () => {
    const props = createDiffCellProps({
      line: createMockLine(),
      side: 'left',
      lineType: 'context',
      overlayGroups: {
        0: [
          <span key="1" data-testid="o1">
            O1
          </span>,
          <span key="2" data-testid="o2">
            O2
          </span>,
        ],
      },
    })

    renderDiffCell(props)

    expect(screen.getByTestId('o1')).toBeInTheDocument()
    expect(screen.getByTestId('o2')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Misc edge cases
  // -------------------------------------------------------------------------
  it('handles missing onLoadMoreLines handler safely', () => {
    const props = createDiffCellProps({
      line: createHunkLine('@@ -1,3 +1,3 @@', 'out'),
      side: 'left',
      lineType: 'hunk',
      isHunk: true,
      onLoadMoreLines: undefined,
    })

    renderDiffCell(props)

    expect(() => fireEvent.click(screen.getByTestId('load-more-button'))).not.toThrow()
  })

  it.each([
    { lineType: 'add', expectedPrefix: '+' },
    { lineType: 'delete', expectedPrefix: '-' },
    { lineType: 'context', expectedPrefix: ' ' },
    { lineType: 'hunk', expectedPrefix: ' ' },
    { lineType: 'empty', expectedPrefix: ' ' },
  ] as Array<{ lineType: DiffLineType; expectedPrefix: string }>)(
    'renders correct prefix for $lineType (split view)',
    ({ lineType, expectedPrefix }) => {
      const props = createDiffCellProps({
        line: createMockLine({
          highlightedContentLeft: '<span>content</span>',
        }),
        side: 'left',
        lineType,
      })

      renderDiffCell(props)

      const [, codeCell] = screen.getAllByRole('cell')
      // Prefix is rendered in a separate span, so we check for the span content
      const prefixSpan = codeCell.querySelector('[style*="user-select: none"]')
      expect(prefixSpan).toBeInTheDocument()
      if (prefixSpan) {
        if (expectedPrefix === ' ') {
          expect(prefixSpan.innerHTML).toBe(' ')
        } else {
          expect(prefixSpan.innerHTML).toBe(expectedPrefix)
        }
      }
      expect(codeCell).toHaveTextContent('content')
    },
  )

  it('renders correct content for each side', () => {
    const line = createMockLine({
      lineNumberLeft: 5,
      lineNumberRight: 10,
      highlightedContentLeft: '<span>left</span>',
      highlightedContentRight: '<span>right</span>',
    })

    // left
    const { unmount: unmountLeft } = renderDiffCell(createDiffCellProps({ line, side: 'left', lineType: 'context' }))
    let cells = screen.getAllByRole('cell')
    expect(cells[0]).toHaveTextContent('5')
    expect(cells[1]).toHaveTextContent('left')
    unmountLeft()

    // right
    renderDiffCell(createDiffCellProps({ line, side: 'right', lineType: 'context' }))
    cells = screen.getAllByRole('cell')
    expect(cells[0]).toHaveTextContent('10')
    expect(cells[1]).toHaveTextContent('right')
  })

  it('safely renders raw HTML', () => {
    const props = createDiffCellProps({
      line: createMockLine({
        highlightedContentLeft: '<span class="hlt">test</span><strong>bold</strong>',
      }),
      side: 'left',
      lineType: 'context',
    })

    renderDiffCell(props)

    const [, codeCell] = screen.getAllByRole('cell')
    expect(codeCell).toHaveTextContent('test')
    expect(codeCell).toHaveTextContent('bold')
    expect(codeCell.innerHTML).toContain('<span class="hlt">')
    expect(codeCell.innerHTML).toContain('<strong>')
  })
})
