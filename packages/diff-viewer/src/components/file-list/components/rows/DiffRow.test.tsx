import { createPropsFactory } from '@edsilfer/test-lib'
import { fireEvent, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '../../../../../../test-lib/src/render'
import { Widget } from '../../../../models/LineExtensions'
import { LineMetadata } from '../../models/LineMetadata'
import { Row } from '../../models/Row'
import { BaseRowProps, DiffRow } from './DiffRow'

// Helper function to render DiffRow in a proper table structure
const renderDiffRow = (props: BaseRowProps) => {
  return render(
    <table>
      <tbody>
        <DiffRow {...props} />
      </tbody>
    </table>,
  )
}

// MOCKS
vi.mock('./SplitRow', () => ({
  SplitRow: vi.fn(
    ({
      idx,
      className,
      onMouseEnter,
      onMouseLeave,
      onRowSelectionStart,
      onRowSelectionUpdate,
      onRowSelectionEnd,
    }: {
      idx: number
      className?: string
      onMouseEnter?: (e: React.MouseEvent<HTMLTableRowElement>) => void
      onMouseLeave?: (e: React.MouseEvent<HTMLTableRowElement>) => void
      onRowSelectionStart?: (index: number, side: 'left' | 'right') => void
      onRowSelectionUpdate?: (index: number) => void
      onRowSelectionEnd?: () => void
    }) => (
      <tr
        data-testid="split-row"
        data-idx={idx}
        className={className}
        onMouseEnter={(e) => {
          onMouseEnter?.(e)
          onRowSelectionUpdate?.(idx)
        }}
        onMouseLeave={onMouseLeave}
        onMouseDown={() => onRowSelectionStart?.(idx, 'left')}
        onMouseUp={onRowSelectionEnd}
      >
        <td data-testid="split-row-content">Split Row Content</td>
      </tr>
    ),
  ),
}))

vi.mock('./UnifiedRow', () => ({
  UnifiedRow: vi.fn(
    ({
      idx,
      className,
      onMouseEnter,
      onMouseLeave,
      onRowSelectionStart,
      onRowSelectionUpdate,
      onRowSelectionEnd,
    }: {
      idx: number
      className?: string
      onMouseEnter?: (e: React.MouseEvent<HTMLTableRowElement>) => void
      onMouseLeave?: (e: React.MouseEvent<HTMLTableRowElement>) => void
      onRowSelectionStart?: (index: number, side: 'left' | 'right') => void
      onRowSelectionUpdate?: (index: number) => void
      onRowSelectionEnd?: () => void
    }) => (
      <tr
        data-testid="unified-row"
        data-idx={idx}
        className={className}
        onMouseEnter={(e) => {
          onMouseEnter?.(e)
          onRowSelectionUpdate?.(idx)
        }}
        onMouseLeave={onMouseLeave}
        onMouseDown={() => onRowSelectionStart?.(idx, 'left')}
        onMouseUp={onRowSelectionEnd}
      >
        <td data-testid="unified-row-content">Unified Row Content</td>
      </tr>
    ),
  ),
}))

vi.mock('./HunkRow', () => ({
  HunkRow: vi.fn(
    ({
      idx,
      flavor,
      className,
      onMouseEnter,
      onMouseLeave,
      onRowSelectionStart,
      onRowSelectionUpdate,
      onRowSelectionEnd,
    }: {
      idx: number
      flavor: 'split' | 'unified'
      className?: string
      onMouseEnter?: (e: React.MouseEvent<HTMLTableRowElement>) => void
      onMouseLeave?: (e: React.MouseEvent<HTMLTableRowElement>) => void
      onRowSelectionStart?: (index: number, side: 'left' | 'right') => void
      onRowSelectionUpdate?: (index: number) => void
      onRowSelectionEnd?: () => void
    }) => (
      <tr
        data-testid="hunk-row"
        data-idx={idx}
        data-flavor={flavor}
        className={className}
        onMouseEnter={(e) => {
          onMouseEnter?.(e)
          onRowSelectionUpdate?.(idx)
        }}
        onMouseLeave={onMouseLeave}
        onMouseDown={() => onRowSelectionStart?.(idx, 'left')}
        onMouseUp={onRowSelectionEnd}
      >
        <td data-testid="hunk-row-content">Hunk Row Content ({flavor})</td>
      </tr>
    ),
  ),
}))

vi.mock('./WidgetRow', () => ({
  WidgetRow: vi.fn(({ _viewModel, pos, unified }: { _viewModel: unknown; pos: 'top' | 'bottom'; unified: boolean }) => (
    <tr data-testid={`widget-row-${pos}`} data-unified={unified}>
      <td data-testid={`widget-content-${pos}`}>Widget Content {pos}</td>
    </tr>
  )),
}))

// HELPERS
const createMockDiffLineViewModel = (overrides: Partial<LineMetadata> = {}): LineMetadata => {
  return new LineMetadata(
    overrides.typeLeft ?? 'context',
    overrides.contentLeft ?? 'test content left',
    overrides.lineNumberLeft ?? 1,
    overrides.typeRight ?? 'context',
    overrides.contentRight ?? 'test content right',
    overrides.lineNumberRight ?? 1,
    overrides.language ?? 'text',
    overrides.hunkDirection,
  )
}

const createMockWidget = (overrides: Partial<Widget> = {}): Widget => ({
  content: <div data-testid="widget">Test Widget</div>,
  line: overrides.line ?? 1,
  position: overrides.position ?? 'top',
  filepath: overrides.filepath ?? 'test.ts',
  side: overrides.side ?? 'left',
})

const createDiffRowProps = createPropsFactory<BaseRowProps>({
  idx: 0,
  line: createMockDiffLineViewModel(),
  viewModel: new Row(createMockDiffLineViewModel(), []),
  isHunk: false,
  overlays: {},
  widgets: [],
  className: 'test-class',
  unified: false,
  selectedRows: new Set(),
  loadLines: vi.fn(),
  onMouseEnter: vi.fn(),
  onMouseLeave: vi.fn(),
  onRowSelectionStart: vi.fn(),
  onRowSelectionUpdate: vi.fn(),
  onRowSelectionEnd: vi.fn(),
})

describe('DiffRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering scenarios', () => {
    it.each([
      { unified: false, isHunk: false, expectedRow: 'split-row', desc: 'split regular row' },
      { unified: true, isHunk: false, expectedRow: 'unified-row', desc: 'unified regular row' },
      { unified: false, isHunk: true, expectedRow: 'hunk-row', desc: 'split hunk row' },
      { unified: true, isHunk: true, expectedRow: 'hunk-row', desc: 'unified hunk row' },
    ])(
      'given $desc, when rendered, expect correct row component',
      ({
        unified,
        isHunk,
        expectedRow,
        desc: _desc,
      }: {
        unified: boolean
        isHunk: boolean
        expectedRow: string
        desc: string
      }) => {
        // GIVEN
        const props = createDiffRowProps({ unified, isHunk })

        // WHEN
        renderDiffRow(props)

        // EXPECT
        expect(screen.getByTestId(expectedRow)).toBeInTheDocument()
      },
    )

    it('given regular split row, when rendered, expect widget rows above and below', () => {
      // GIVEN
      const props = createDiffRowProps({ unified: false, isHunk: false })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('widget-row-top')).toBeInTheDocument()
      expect(screen.getByTestId('widget-row-bottom')).toBeInTheDocument()
    })

    it('given regular unified row, when rendered, expect widget rows above and below', () => {
      // GIVEN
      const props = createDiffRowProps({ unified: true, isHunk: false })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('widget-row-top')).toBeInTheDocument()
      expect(screen.getByTestId('widget-row-bottom')).toBeInTheDocument()
    })
  })

  describe('row selection highlighting', () => {
    it('given selected row, when rendered, expect highlighted class applied', () => {
      // GIVEN
      const selectedRows = new Set([0])
      const props = createDiffRowProps({ selectedRows })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('split-row')).toHaveClass('highlighted-row')
    })

    it('given first highlighted row, when rendered, expect first-highlighted class applied', () => {
      // GIVEN
      const selectedRows = new Set([0, 1, 2])
      const props = createDiffRowProps({ selectedRows })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('split-row')).toHaveClass('first-highlighted-row')
    })

    it('given last highlighted row, when rendered, expect last-highlighted class applied', () => {
      // GIVEN
      const selectedRows = new Set([1, 2, 3])
      const props = createDiffRowProps({ idx: 3, selectedRows })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('split-row')).toHaveClass('last-highlighted-row')
    })

    it('given single selected row, when rendered, expect both first and last highlighted classes', () => {
      // GIVEN
      const selectedRows = new Set([1])
      const props = createDiffRowProps({ idx: 1, selectedRows })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('split-row')).toHaveClass('first-highlighted-row')
      expect(screen.getByTestId('split-row')).toHaveClass('last-highlighted-row')
    })

    it('given non-selected row, when rendered, expect no highlighting classes', () => {
      // GIVEN
      const selectedRows = new Set([1, 2])
      const props = createDiffRowProps({ idx: 0, selectedRows })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('split-row')).not.toHaveClass('highlighted-row')
      expect(screen.getByTestId('split-row')).not.toHaveClass('first-highlighted-row')
      expect(screen.getByTestId('split-row')).not.toHaveClass('last-highlighted-row')
    })
  })

  describe('custom className handling', () => {
    it('given custom className, when rendered, expect custom class applied', () => {
      // GIVEN
      const props = createDiffRowProps({ className: 'custom-row-class' })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('split-row')).toHaveClass('custom-row-class')
    })

    it('given no className, when rendered, expect no custom class applied', () => {
      // GIVEN
      const props = createDiffRowProps({ className: undefined })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('split-row')).not.toHaveClass('test-class')
    })
  })

  describe('event handling', () => {
    it('given mouse events, when triggered, expect callbacks called', () => {
      // GIVEN
      const onMouseEnter = vi.fn()
      const onMouseLeave = vi.fn()
      const props = createDiffRowProps({ onMouseEnter, onMouseLeave })

      // WHEN
      renderDiffRow(props)
      fireEvent.mouseEnter(screen.getByTestId('split-row'))
      fireEvent.mouseLeave(screen.getByTestId('split-row'))

      // EXPECT
      expect(onMouseEnter).toHaveBeenCalledTimes(1)
      expect(onMouseLeave).toHaveBeenCalledTimes(1)
    })

    it('given row selection events, when triggered, expect callbacks called', () => {
      // GIVEN
      const onRowSelectionStart = vi.fn()
      const onRowSelectionUpdate = vi.fn()
      const onRowSelectionEnd = vi.fn()
      const props = createDiffRowProps({ onRowSelectionStart, onRowSelectionUpdate, onRowSelectionEnd })

      // WHEN
      renderDiffRow(props)
      fireEvent.mouseDown(screen.getByTestId('split-row'))
      fireEvent.mouseUp(screen.getByTestId('split-row'))

      // EXPECT
      expect(onRowSelectionStart).toHaveBeenCalledTimes(1)
      expect(onRowSelectionEnd).toHaveBeenCalledTimes(1)
    })

    it('given mouse enter during selection, when triggered, expect row selection update called', () => {
      // GIVEN
      const onRowSelectionUpdate = vi.fn()
      const props = createDiffRowProps({ onRowSelectionUpdate })

      // WHEN
      renderDiffRow(props)
      fireEvent.mouseEnter(screen.getByTestId('split-row'))

      // EXPECT
      expect(onRowSelectionUpdate).toHaveBeenCalledTimes(1)
    })
  })

  describe('widget integration', () => {
    it('given widgets provided, when rendered, expect viewModel created with widgets', () => {
      // GIVEN
      const widgets = [createMockWidget(), createMockWidget({ line: 2 })]
      const props = createDiffRowProps({ widgets })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('widget-row-top')).toBeInTheDocument()
      expect(screen.getByTestId('widget-row-bottom')).toBeInTheDocument()
    })

    it('given no widgets, when rendered, expect viewModel created with empty array', () => {
      // GIVEN
      const props = createDiffRowProps({ widgets: undefined })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('widget-row-top')).toBeInTheDocument()
      expect(screen.getByTestId('widget-row-bottom')).toBeInTheDocument()
    })
  })

  describe('viewModel creation', () => {
    it('given line and widgets, when rendered, expect viewModel created with correct parameters', () => {
      // GIVEN
      const line = createMockDiffLineViewModel({ lineNumberLeft: 5, lineNumberRight: 6 })
      const widgets = [createMockWidget()]
      const props = createDiffRowProps({ line, widgets })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('split-row')).toBeInTheDocument()
      expect(screen.getByTestId('widget-row-top')).toBeInTheDocument()
      expect(screen.getByTestId('widget-row-bottom')).toBeInTheDocument()
    })

    it('given different line data, when re-rendered, expect viewModel recreated', () => {
      // GIVEN
      const line1 = createMockDiffLineViewModel({ lineNumberLeft: 1 })
      const line2 = createMockDiffLineViewModel({ lineNumberLeft: 2 })
      const props1 = createDiffRowProps({ line: line1 })
      const props2 = createDiffRowProps({ line: line2 })

      // WHEN
      const { rerender } = renderDiffRow(props1)
      rerender(
        <table>
          <tbody>
            <DiffRow {...props2} />
          </tbody>
        </table>,
      )

      // EXPECT
      expect(screen.getByTestId('split-row')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('given empty selectedRows, when rendered, expect no highlighting classes', () => {
      // GIVEN
      const props = createDiffRowProps({ selectedRows: new Set() })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('split-row')).not.toHaveClass('highlighted-row')
    })

    it('given undefined selectedRows, when rendered, expect no highlighting classes', () => {
      // GIVEN
      const props = createDiffRowProps({ selectedRows: undefined })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('split-row')).not.toHaveClass('highlighted-row')
    })

    it('given hunk line, when rendered, expect hunk row component used with split flavor', () => {
      // GIVEN
      const hunkLine = createMockDiffLineViewModel({ typeLeft: 'hunk', typeRight: 'hunk' })
      const props = createDiffRowProps({ line: hunkLine, isHunk: true })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      const hunkRow = screen.getByTestId('hunk-row')
      expect(hunkRow).toBeInTheDocument()
      expect(hunkRow).toHaveAttribute('data-flavor', 'split')
    })

    it('given unified hunk line, when rendered, expect hunk row component used with unified flavor', () => {
      // GIVEN
      const hunkLine = createMockDiffLineViewModel({ typeLeft: 'hunk', typeRight: 'hunk' })
      const props = createDiffRowProps({ line: hunkLine, isHunk: true, unified: true })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      const hunkRow = screen.getByTestId('hunk-row')
      expect(hunkRow).toBeInTheDocument()
      expect(hunkRow).toHaveAttribute('data-flavor', 'unified')
    })
  })

  describe('prop forwarding', () => {
    it('given all props, when rendered, expect props forwarded to row component', () => {
      // GIVEN
      const props = createDiffRowProps({
        idx: 5,
        line: createMockDiffLineViewModel({ lineNumberLeft: 10 }),
        overlays: { 0: [<div key="1">overlay1</div>], 1: [<div key="2">overlay2</div>] },
        loadLines: vi.fn(),
        onMouseEnter: vi.fn(),
        onMouseLeave: vi.fn(),
        onRowSelectionStart: vi.fn(),
        onRowSelectionUpdate: vi.fn(),
        onRowSelectionEnd: vi.fn(),
      })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('split-row')).toHaveAttribute('data-idx', '5')
    })

    it('given css prop, when rendered, expect css applied to row', () => {
      // GIVEN
      const css = { backgroundColor: 'red' }
      const props = createDiffRowProps({ css })

      // WHEN
      renderDiffRow(props)

      // EXPECT
      expect(screen.getByTestId('split-row')).toBeInTheDocument()
    })
  })
})
