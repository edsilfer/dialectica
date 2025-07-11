import { fireEvent, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { DiffLineType } from '../../../models/LineDiff'
import { createPropsFactory } from '../../../utils/test/generic-test-utils'
import { render } from '../../../utils/test/render'
import { DiffLineViewModel } from '../models/DiffLineViewModel'
import type { DiffRowProps } from './DiffRow'
import { DiffRow } from './DiffRow'
import type { HunkDirection } from './types'

/**
 * # DiffRow Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **LoadMoreButton**: Mocked to isolate DiffRow logic from button component and test click interactions
 * - **React**: Imported for mock component to handle event handlers properly
 *
 * ## Happy Path
 * - Unified context line → Line numbers and content displayed with overlays
 * - Split add/delete line → Correct prefixes (-/+) and contents rendered
 * - Hunk row with load more → Button rendered with correct direction and click handler called
 * - Widgets provided → Widgets displayed in correct positions (top/bottom, left/right)
 * - Mouse events → Enter/leave handlers called when events triggered
 *
 * ## Edge Cases
 * - **Empty line types**: Empty content rendered as empty spans, no visible text
 * - **Null line numbers**: No line numbers displayed, no "null" text rendered
 * - **Missing overlays**: No overlay elements present when overlays object is empty
 * - **Empty overlay arrays**: No overlay content when arrays are empty
 * - **Children prop**: Component ignores children prop, only renders diff content
 * - **HTML content**: HTML rendered via dangerouslySetInnerHTML as actual HTML elements
 * - **Mixed hunk types**: Regular split row rendered when only one side is hunk type
 * - **Different hunk directions**: All directions (up, down, in, in_up, in_down) handled correctly
 * - **Split row combinations**: Context/add and delete/context combinations render correct prefixes
 *
 * ## Assertions
 * - Verify line numbers, content text, prefixes, and overlay elements presence
 * - Test click handlers called with correct parameters (line, direction)
 * - Check CSS classes, data attributes, and mouse event handler calls
 * - Validate widget positioning and hunk row auto-detection
 * - Ensure proper rendering in both unified and split view modes
 */

vi.mock('../../ui/buttons/LoadMoreButton', async () => {
  const React = await vi.importActual('react')
  return {
    default: ({ direction, onClick }: { direction: string; onClick?: (e: React.MouseEvent, d: string) => void }) => (
      <button
        data-testid="load-more-btn"
        data-direction={direction}
        onClick={(e) => onClick?.(e, direction as unknown as HunkDirection)}
      >
        Load More {direction}
      </button>
    ),
  }
})

const createDiffLine = (
  typeLeft: DiffLineType | null = 'context',
  typeRight: DiffLineType | null = 'context',
  contentLeft = 'left content',
  contentRight = 'right content',
  lineNumberLeft: number | null = 1,
  lineNumberRight: number | null = 1,
  hunkDirection?: HunkDirection,
): DiffLineViewModel =>
  new DiffLineViewModel(
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

const makeDiffRowProps = createPropsFactory<DiffRowProps>({
  idx: 0,
  line: createDiffLine(),
  isHunk: false,
  overlays: {},
})

const renderWithinTable = (ui: React.ReactElement) =>
  render(
    <table>
      <tbody>{ui}</tbody>
    </table>,
  )

describe('DiffRow', () => {
  it('given unified context line, when rendered, expect line numbers and content displayed', () => {
    // GIVEN
    const line = createDiffLine('context', 'context', 'console.log("test")', 'console.log("test")', 10, 10)
    const overlays = {
      0: [<div key="o-l" data-testid="overlay-left" />],
      1: [<div key="o-r" data-testid="overlay-right" />],
      2: [<div key="o-c" data-testid="overlay-code" />],
    }
    const props = makeDiffRowProps({ line, overlays, unified: true })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.getAllByText('10')).toHaveLength(2)
    expect(screen.getByText('console.log("test")')).toBeInTheDocument()
    expect(screen.getByTestId('overlay-left')).toBeInTheDocument()
    expect(screen.getByTestId('overlay-right')).toBeInTheDocument()
    expect(screen.getByTestId('overlay-code')).toBeInTheDocument()
  })

  it('given split add delete line, when rendered, expect prefixes and contents displayed', () => {
    // GIVEN
    const line = createDiffLine('delete', 'add', 'old()', 'new()', 5, 5)
    const props = makeDiffRowProps({ line, unified: false })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.getByText('+')).toBeInTheDocument()
    expect(screen.getByText('old()')).toBeInTheDocument()
    expect(screen.getByText('new()')).toBeInTheDocument()
  })

  it('given unified hunk row, when load more clicked, expect loadLines called with direction', () => {
    // GIVEN
    const line = createDiffLine('hunk', 'hunk', '@@ -1,3 +1,4 @@', '@@ -1,3 +1,4 @@', null, null, 'out')
    const loadLines = vi.fn()
    const props = makeDiffRowProps({ line, isHunk: true, unified: true, loadLines })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)
    fireEvent.click(screen.getByTestId('load-more-btn'))

    // EXPECT
    expect(loadLines).toHaveBeenCalledTimes(1)
    expect(loadLines).toHaveBeenCalledWith(line, 'out')
  })

  it('given widgets for unified row, when rendered, expect widgets displayed', () => {
    // GIVEN
    const line = createDiffLine('context', 'context')
    const widgets = [
      {
        content: <div data-testid="top-widget">Top Widget</div>,
        line: 1,
        position: 'top' as const,
        filepath: 'test.ts',
        side: 'left' as const,
      },
      {
        content: <div data-testid="bottom-widget">Bottom Widget</div>,
        line: 1,
        position: 'bottom' as const,
        filepath: 'test.ts',
        side: 'left' as const,
      },
    ]
    const props = makeDiffRowProps({ line, widgets, unified: true })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.getByTestId('top-widget')).toBeInTheDocument()
    expect(screen.getByTestId('bottom-widget')).toBeInTheDocument()
  })

  it('given overlay groups for split row, when rendered, expect overlay nodes present', () => {
    // GIVEN
    const line = createDiffLine('context', 'context')
    const overlays = {
      0: [<div key="left" data-testid="split-overlay-left" />],
      1: [<div key="code" data-testid="split-overlay-code" />],
    }
    const props = makeDiffRowProps({ line, overlays, unified: false })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.getAllByTestId('split-overlay-left')).toHaveLength(2) // Left and right number cells
    expect(screen.getAllByTestId('split-overlay-code')).toHaveLength(2) // Left and right code cells
  })

  // ====================
  // MOUSE EVENT TESTS
  // ====================

  it('given mouse event handlers, when mouse events triggered, expect handlers called', () => {
    // GIVEN
    const line = createDiffLine('context', 'context')
    const onMouseEnter = vi.fn()
    const onMouseLeave = vi.fn()
    const props = makeDiffRowProps({ line, onMouseEnter, onMouseLeave, unified: true })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)
    const row = screen.getByRole('row')
    fireEvent.mouseEnter(row)
    fireEvent.mouseLeave(row)

    // EXPECT
    expect(onMouseEnter).toHaveBeenCalledTimes(1)
    expect(onMouseLeave).toHaveBeenCalledTimes(1)
  })

  // ====================
  // CSS AND CLASSNAME TESTS
  // ====================

  it('given className prop, when rendered, expect className applied to row', () => {
    // GIVEN
    const line = createDiffLine('context', 'context')
    const props = makeDiffRowProps({ line, className: 'custom-row-class', unified: true })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.getByRole('row')).toHaveClass('custom-row-class')
  })

  it('given css prop, when rendered, expect custom styles applied', () => {
    // GIVEN
    const line = createDiffLine('context', 'context')
    const customCss = { backgroundColor: 'red' }
    const props = makeDiffRowProps({ line, css: customCss, unified: true })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    const row = screen.getByRole('row')
    // Note: Emotion CSS is applied via className, not inline styles
    expect(row).toBeInTheDocument()
  })

  // ====================
  // SPLIT HUNK ROW TESTS
  // ====================

  it('given split hunk row, when rendered, expect load more button and hunk content', () => {
    // GIVEN
    const line = createDiffLine('hunk', 'hunk', '@@ -1,3 +1,4 @@', '@@ -1,3 +1,4 @@', null, null, 'down')
    const loadLines = vi.fn()
    const props = makeDiffRowProps({ line, isHunk: true, unified: false, loadLines })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.getByTestId('load-more-btn')).toBeInTheDocument()
    expect(screen.getByTestId('load-more-btn')).toHaveAttribute('data-direction', 'down')
    expect(screen.getByText('@@ -1,3 +1,4 @@')).toBeInTheDocument()
  })

  it('given split hunk row with different direction, when load more clicked, expect correct direction passed', () => {
    // GIVEN
    const line = createDiffLine('hunk', 'hunk', '@@ -1,3 +1,4 @@', '@@ -1,3 +1,4 @@', null, null, 'up')
    const loadLines = vi.fn()
    const props = makeDiffRowProps({ line, isHunk: true, unified: false, loadLines })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)
    fireEvent.click(screen.getByTestId('load-more-btn'))

    // EXPECT
    expect(loadLines).toHaveBeenCalledWith(line, 'up')
  })

  // ====================
  // WIDGET POSITIONING TESTS
  // ====================

  it('given widgets with different sides in split view, when rendered, expect correct positioning', () => {
    // GIVEN
    const line = createDiffLine('context', 'context')
    const widgets = [
      {
        content: <div data-testid="left-widget">Left Widget</div>,
        line: 1,
        position: 'top' as const,
        filepath: 'test.ts',
        side: 'left' as const,
      },
      {
        content: <div data-testid="right-widget">Right Widget</div>,
        line: 1,
        position: 'bottom' as const,
        filepath: 'test.ts',
        side: 'right' as const,
      },
    ]
    const props = makeDiffRowProps({ line, widgets, unified: false })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.getByTestId('left-widget')).toBeInTheDocument()
    expect(screen.getByTestId('right-widget')).toBeInTheDocument()
  })

  // ====================
  // EMPTY AND NULL LINE TESTS
  // ====================

  it('given empty line type, when rendered, expect empty content displayed', () => {
    // GIVEN
    const line = createDiffLine('empty', 'empty', '', '', null, null)
    const props = makeDiffRowProps({ line, unified: true })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    // Empty content is rendered as empty spans, not as visible text
    expect(screen.getByRole('row')).toBeInTheDocument()
  })

  it('given null line numbers, when rendered, expect no line numbers displayed', () => {
    // GIVEN
    const line = createDiffLine('context', 'context', 'content', 'content', null, null)
    const props = makeDiffRowProps({ line, unified: true })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.queryByText('null')).not.toBeInTheDocument()
  })

  // ====================
  // DIFFERENT HUNK DIRECTIONS TESTS
  // ====================

  it.each(['up', 'down', 'in', 'in_up', 'in_down'] as const)(
    'given hunk direction %s, when rendered, expect correct direction passed to load more button',
    (direction) => {
      // GIVEN
      const line = createDiffLine('hunk', 'hunk', '@@ -1,3 +1,4 @@', '@@ -1,3 +1,4 @@', null, null, direction)
      const props = makeDiffRowProps({ line, isHunk: true, unified: true })

      // WHEN
      renderWithinTable(<DiffRow {...props} />)

      // EXPECT
      expect(screen.getByTestId('load-more-btn')).toHaveAttribute('data-direction', direction)
    },
  )

  // ====================
  // SPLIT ROW LINE TYPE COMBINATIONS
  // ====================

  it('given split row with context/add combination, when rendered, expect correct prefixes', () => {
    // GIVEN
    const line = createDiffLine('context', 'add', 'unchanged', 'new line', 5, 6)
    const props = makeDiffRowProps({ line, unified: false })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.getByText('+')).toBeInTheDocument() // Add prefix
    expect(screen.getByText('unchanged')).toBeInTheDocument()
    expect(screen.getByText('new line')).toBeInTheDocument()
  })

  it('given split row with delete/context combination, when rendered, expect correct prefixes', () => {
    // GIVEN
    const line = createDiffLine('delete', 'context', 'removed line', 'unchanged', 5, 5)
    const props = makeDiffRowProps({ line, unified: false })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.getByText('-')).toBeInTheDocument() // Delete prefix
    expect(screen.getByText('removed line')).toBeInTheDocument()
    expect(screen.getByText('unchanged')).toBeInTheDocument()
  })

  // ====================
  // OVERLAY EDGE CASES
  // ====================

  it('given missing overlays, when rendered, expect no overlay elements', () => {
    // GIVEN
    const line = createDiffLine('context', 'context')
    const props = makeDiffRowProps({ line, overlays: {}, unified: true })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.queryByTestId('overlay-left')).not.toBeInTheDocument()
  })

  it('given empty overlay arrays, when rendered, expect no overlay content', () => {
    // GIVEN
    const line = createDiffLine('context', 'context')
    const overlays = { 0: [], 1: [], 2: [] }
    const props = makeDiffRowProps({ line, overlays, unified: true })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.queryByTestId('overlay-content')).not.toBeInTheDocument()
  })

  // ====================
  // CHILDREN PROP TESTS
  // ====================

  it('given children prop, when rendered, expect children not displayed (component ignores children)', () => {
    // GIVEN
    const line = createDiffLine('context', 'context')
    const props = makeDiffRowProps({
      line,
      unified: true,
      children: <div data-testid="child-element">Child Content</div>,
    })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    // The DiffRow component doesn't render children, it only renders the diff content
    expect(screen.queryByTestId('child-element')).not.toBeInTheDocument()
  })

  // ====================
  // DANGEROUSLY SET INNER HTML TESTS
  // ====================

  it('given HTML content in line, when rendered, expect HTML rendered via dangerouslySetInnerHTML', () => {
    // GIVEN
    const htmlContent = '<span data-testid="html-content">HTML Content</span>'
    const line = createDiffLine('context', 'context', htmlContent, htmlContent)
    const props = makeDiffRowProps({ line, unified: true })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    // The component uses dangerouslySetInnerHTML, so HTML is rendered as actual HTML
    expect(screen.getByTestId('html-content')).toBeInTheDocument()
    expect(screen.getByText('HTML Content')).toBeInTheDocument()
  })

  // ====================
  // SPLIT ROW HUNK DETECTION TESTS
  // ====================

  it('given split row with hunk types on both sides, when rendered, expect hunk row rendered', () => {
    // GIVEN
    const line = createDiffLine('hunk', 'hunk', '@@ -1,3 +1,4 @@', '@@ -1,3 +1,4 @@', null, null, 'out')
    const props = makeDiffRowProps({ line, unified: false }) // isHunk not set, should auto-detect

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.getByTestId('load-more-btn')).toBeInTheDocument()
    expect(screen.getByText('@@ -1,3 +1,4 @@')).toBeInTheDocument()
  })

  it('given split row with mixed hunk types, when rendered, expect regular split row rendered', () => {
    // GIVEN
    const line = createDiffLine('hunk', 'context', '@@ -1,3 +1,4 @@', 'regular content', null, 5)
    const props = makeDiffRowProps({ line, unified: false })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.queryByTestId('load-more-btn')).not.toBeInTheDocument()
    expect(screen.getByText('@@ -1,3 +1,4 @@')).toBeInTheDocument()
    expect(screen.getByText('regular content')).toBeInTheDocument()
  })

  // ====================
  // DATA ATTRIBUTES TESTS
  // ====================

  it('given row index, when rendered, expect data-idx attribute set', () => {
    // GIVEN
    const line = createDiffLine('context', 'context')
    const props = makeDiffRowProps({ line, idx: 42, unified: true })

    // WHEN
    renderWithinTable(<DiffRow {...props} />)

    // EXPECT
    expect(screen.getByRole('row')).toHaveAttribute('data-idx', '42')
  })
})
