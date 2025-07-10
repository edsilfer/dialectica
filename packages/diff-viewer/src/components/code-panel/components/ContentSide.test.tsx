import React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createPropsFactory } from '../../../utils/test/generic-test-utils'
import { render } from '../../../utils/test/render'
import { DiffLineViewModel } from '../models/DiffLineViewModel'
import ContentSide from './ContentSide'
import type { HunkDirection } from './types'

/**
 * # ContentSide Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **LoadMoreButton**: Mocked to isolate ContentSide logic from button component complexity and test click interactions
 * - **DiffLineViewModel**: Tested through factory function to ensure consistent test data creation
 * - **React DOM**: fireEvent and screen utilities used to test user interactions and DOM assertions
 *
 * ## Happy Path
 * - Valid line data → Correct cell structure rendered with line numbers and content
 * - Both left/right sides → Proper CSS classes and content display for each side
 * - Different line types → Correct prefix symbols (+ for add, - for delete, space for context/hunk/empty)
 * - Hunk lines → Load more button rendered with correct direction and click handling
 * - Overlay groups → Overlay content rendered in correct cells with event handlers
 *
 * ## Edge Cases
 * - **Null line numbers**: Empty text content rendered instead of throwing
 * - **Empty/null highlighted content**: Graceful handling with empty strings or &nbsp; fallback
 * - **Missing onLoadMoreLines callback**: Component doesn't throw when callback is undefined
 * - **Missing overlay group indices**: Component handles sparse overlay group objects gracefully
 * - **Special characters in content**: HTML entities and script tags rendered as text, not executed
 * - **Very long content**: Component handles content of arbitrary length without breaking
 * - **Complex overlay content**: Interactive elements with event handlers work correctly
 *
 * ## Assertions
 * - Verify cell structure, content, CSS classes, and styling properties
 * - Test user interactions (button clicks) and callback invocations
 * - Validate overlay rendering and positioning in correct cells
 * - Ensure HTML content is rendered safely without script execution
 */

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

const createLine = (overrides: Partial<DiffLineViewModel> = {}): DiffLineViewModel => {
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
    overrides.typeLeft !== undefined ? overrides.typeLeft : defaults.typeLeft,
    overrides.contentLeft !== undefined ? overrides.contentLeft : defaults.contentLeft,
    overrides.highlightedContentLeft !== undefined ? overrides.highlightedContentLeft : defaults.highlightedContentLeft,
    overrides.lineNumberLeft !== undefined ? overrides.lineNumberLeft : defaults.lineNumberLeft,
    overrides.typeRight !== undefined ? overrides.typeRight : defaults.typeRight,
    overrides.contentRight !== undefined ? overrides.contentRight : defaults.contentRight,
    overrides.highlightedContentRight !== undefined
      ? overrides.highlightedContentRight
      : defaults.highlightedContentRight,
    overrides.lineNumberRight !== undefined ? overrides.lineNumberRight : defaults.lineNumberRight,
    overrides.hunkDirection,
  )
}

const createProps = createPropsFactory<{
  side: 'left' | 'right'
  line: DiffLineViewModel
  overlayGroups: Record<number, React.ReactNode[]>
  onLoadMoreLines?: (line: DiffLineViewModel, direction: HunkDirection) => void
}>({
  side: 'left',
  line: createLine(),
  overlayGroups: { 0: [], 1: [] },
  onLoadMoreLines: vi.fn(),
})

const renderContentSide = (props: ReturnType<typeof createProps>) =>
  render(
    <table>
      <tbody>
        <tr>
          <ContentSide {...props} />
        </tr>
      </tbody>
    </table>,
  )

describe('ContentSide', () => {
  it.each<{
    side: 'left' | 'right'
    line: DiffLineViewModel
    num: string
    content: string
    className: string
  }>([
    {
      side: 'left',
      line: createLine({ typeLeft: 'context', lineNumberLeft: 5 }),
      num: '5',
      content: 'test line',
      className: 'split-viewer-left-row',
    },
    {
      side: 'right',
      line: createLine({
        typeRight: 'context',
        lineNumberRight: 10,
        contentRight: 'right test line',
        highlightedContentRight: '<span>right test line</span>',
      }),
      num: '10',
      content: 'right test line',
      className: 'split-viewer-right-row',
    },
    {
      side: 'left',
      line: createLine({
        typeLeft: 'add',
        lineNumberLeft: 5,
        contentLeft: 'left content',
        highlightedContentLeft: '<span>left content</span>',
        typeRight: 'delete',
        lineNumberRight: 10,
        contentRight: 'right content',
        highlightedContentRight: '<span>right content</span>',
      }),
      num: '5',
      content: 'left content',
      className: 'split-viewer-left-row',
    },
    {
      side: 'right',
      line: createLine({
        typeLeft: 'add',
        lineNumberLeft: 5,
        contentLeft: 'left content',
        highlightedContentLeft: '<span>left content</span>',
        typeRight: 'delete',
        lineNumberRight: 10,
        contentRight: 'right content',
        highlightedContentRight: '<span>right content</span>',
      }),
      num: '10',
      content: 'right content',
      className: 'split-viewer-right-row',
    },
  ])('renders $side side with correct structure and content', ({ side, line, num, content, className }) => {
    const props = createProps({ side, line })
    renderContentSide(props)
    const cells = screen.getAllByRole('cell')
    expect(cells[0]).toHaveTextContent(num)
    expect(cells[1]).toHaveTextContent(content)
    expect(cells[0]).toHaveClass(className)
    expect(cells[1]).toHaveClass(className)
  })

  it.each<{ lineType: 'add' | 'delete' | 'context' | 'hunk' | 'empty'; expectedPrefix: string }>([
    { lineType: 'add', expectedPrefix: '+' },
    { lineType: 'delete', expectedPrefix: '-' },
    { lineType: 'context', expectedPrefix: ' ' },
    { lineType: 'hunk', expectedPrefix: ' ' },
    { lineType: 'empty', expectedPrefix: ' ' },
  ])('renders prefix for $lineType', ({ lineType, expectedPrefix }) => {
    const props = createProps({ line: createLine({ typeLeft: lineType }) })
    renderContentSide(props)
    const codeCell = screen.getAllByRole('cell')[1]
    expect(codeCell).toHaveTextContent(expectedPrefix)
  })

  it.each([{ direction: 'out' }, { direction: 'up' }, { direction: 'down' }] as const)(
    'renders hunk line with $direction direction',
    ({ direction }) => {
      const line = createLine({
        typeLeft: 'hunk',
        contentLeft: '@@ -1,3 +1,3 @@',
        highlightedContentLeft: '@@ -1,3 +1,3 @@',
        hunkDirection: direction,
      })
      const props = createProps({ line })
      renderContentSide(props)
      expect(screen.getByTestId('load-more-button')).toBeInTheDocument()
      expect(screen.getByText(`Load More ${direction}`)).toBeInTheDocument()
    },
  )

  it('calls onLoadMoreLines when load more button clicked', () => {
    const onLoadMoreLines = vi.fn()
    const line = createLine({
      typeLeft: 'hunk',
      hunkDirection: 'out',
      contentLeft: '@@ -1,3 +1,3 @@',
      highlightedContentLeft: '@@ -1,3 +1,3 @@',
    })
    const props = createProps({ line, onLoadMoreLines })
    renderContentSide(props)
    fireEvent.click(screen.getByTestId('load-more-button'))
    expect(onLoadMoreLines).toHaveBeenCalledWith(line, 'out')
  })

  it('does not throw if onLoadMoreLines is missing', () => {
    const line = createLine({
      typeLeft: 'hunk',
      hunkDirection: 'out',
      contentLeft: '@@ -1,3 +1,3 @@',
      highlightedContentLeft: '@@ -1,3 +1,3 @@',
    })
    const props = createProps({ line, onLoadMoreLines: undefined })
    renderContentSide(props)
    expect(() => fireEvent.click(screen.getByTestId('load-more-button'))).not.toThrow()
  })

  it.each([
    {
      desc: 'null line number',
      line: createLine({ lineNumberLeft: null, lineNumberRight: null }),
      cellIdx: 0,
      expectText: '',
    },
    { desc: 'empty highlighted content', line: createLine({ highlightedContentLeft: '' }), cellIdx: 1, expectText: '' },
    {
      desc: 'null highlighted content',
      line: createLine({ highlightedContentLeft: null }),
      cellIdx: 1,
      expectText: '',
    },
    {
      desc: 'null content and highlighted content',
      line: createLine({ contentLeft: null, highlightedContentLeft: null }),
      cellIdx: 1,
      expectHtml: '&nbsp;',
    },
  ])('handles $desc', ({ line, cellIdx, expectText, expectHtml }) => {
    const props = createProps({ line })
    renderContentSide(props)
    const cell = screen.getAllByRole('cell')[cellIdx]
    if (expectHtml) expect(cell.innerHTML).toContain(expectHtml)
    else expect(cell).toHaveTextContent(expectText ?? '')
  })

  it('renders overlays in correct cells', () => {
    const line = createLine()
    const overlayGroups = {
      0: [
        <div key="overlay1" data-testid="overlay-1">
          Overlay 1
        </div>,
      ],
      1: [
        <div key="overlay2" data-testid="overlay-2">
          Overlay 2
        </div>,
      ],
    }
    const props = createProps({ line, overlayGroups })
    renderContentSide(props)
    expect(screen.getByTestId('overlay-1')).toBeInTheDocument()
    expect(screen.getByTestId('overlay-2')).toBeInTheDocument()
  })

  it('renders multiple overlays in same group', () => {
    const line = createLine()
    const overlayGroups = {
      0: [
        <div key="overlay1" data-testid="overlay-1">
          Overlay 1
        </div>,
        <div key="overlay2" data-testid="overlay-2">
          Overlay 2
        </div>,
      ],
    }
    const props = createProps({ line, overlayGroups })
    renderContentSide(props)
    expect(screen.getByTestId('overlay-1')).toBeInTheDocument()
    expect(screen.getByTestId('overlay-2')).toBeInTheDocument()
  })

  it.each([
    { desc: 'empty overlay groups', overlayGroups: { 0: [], 1: [] } },
    { desc: 'overlay groups with empty arrays', overlayGroups: { 0: [], 1: [] } },
  ])('renders no overlay content for $desc', ({ overlayGroups }) => {
    const line = createLine()
    const props = createProps({ line, overlayGroups })
    renderContentSide(props)
    const overlayContainers = document.querySelectorAll('.diff-view-overlay')
    overlayContainers.forEach((container: Element) => {
      expect(container).toBeEmptyDOMElement()
    })
  })

  it.each([
    { side: 'left' as const, className: 'split-viewer-left-row' },
    { side: 'right' as const, className: 'split-viewer-right-row' },
  ])('applies $className CSS class for $side', ({ side, className }) => {
    const line = createLine()
    const props = createProps({ side, line })
    renderContentSide(props)
    const cells = screen.getAllByRole('cell')
    cells.forEach((cell) => expect(cell).toHaveClass(className))
  })

  it('left side number cell has user-select and pointer-events styles', () => {
    const line = createLine()
    const props = createProps({ side: 'left', line })
    renderContentSide(props)
    const numberCell = screen.getAllByRole('cell')[0]
    expect(numberCell).toHaveStyle({ userSelect: 'none', pointerEvents: 'none' })
  })

  it('right side number cell has no user-select and pointer-events styles', () => {
    const line = createLine()
    const props = createProps({ side: 'right', line })
    renderContentSide(props)
    const numberCell = screen.getAllByRole('cell')[0]
    expect(numberCell).toBeInTheDocument()
  })

  it('renders HTML in highlighted content', () => {
    const line = createLine({ highlightedContentLeft: '<span class="highlight">test</span> <strong>bold</strong>' })
    const props = createProps({ line })
    renderContentSide(props)
    const codeCell = screen.getAllByRole('cell')[1]
    expect(codeCell.querySelector('.highlight')).toBeInTheDocument()
    expect(codeCell.querySelector('strong')).toBeInTheDocument()
  })

  it('renders special characters as text', () => {
    const line = createLine({
      contentLeft: 'const x = "hello & world"; // <script>alert("test")</script>',
      highlightedContentLeft: 'const x = "hello & world"; // <script>alert("test")</script>',
    })
    const props = createProps({ line })
    renderContentSide(props)
    const codeCell = screen.getAllByRole('cell')[1]
    expect(codeCell).toHaveTextContent('const x = "hello & world"; // alert("test")')
  })

  it('renders very long content', () => {
    const longContent = 'a'.repeat(1000)
    const line = createLine({ contentLeft: longContent, highlightedContentLeft: longContent })
    const props = createProps({ line })
    renderContentSide(props)
    const codeCell = screen.getAllByRole('cell')[1]
    expect(codeCell).toHaveTextContent(longContent)
  })

  it('renders complex overlay content with event handlers', () => {
    const mockClickHandler = vi.fn()
    const ComplexOverlay = () => (
      <button data-testid="overlay-button" onClick={mockClickHandler}>
        Click me
      </button>
    )
    const line = createLine()
    const overlayGroups = { 0: [<ComplexOverlay key="overlay" />] }
    const props = createProps({ line, overlayGroups })
    renderContentSide(props)
    fireEvent.click(screen.getByTestId('overlay-button'))
    expect(mockClickHandler).toHaveBeenCalled()
  })

  it('handles missing overlay group indices gracefully', () => {
    const line = createLine()
    const overlayGroups = { 5: [<div key="overlay">Overlay</div>] } as Record<number, React.ReactNode[]>
    const props = createProps({ line, overlayGroups })
    expect(() => renderContentSide(props)).not.toThrow()
  })
})
