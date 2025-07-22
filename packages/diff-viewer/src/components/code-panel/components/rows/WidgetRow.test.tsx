import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPropsFactory } from '../../../../../../commons/src/test/generic-test-utils'
import { render } from '../../../../../../test-lib/src/render'
import { Widget } from '../../../diff-viewer/types'
import { DiffLineViewModel } from '../../models/DiffLineViewModel'
import { DiffRowViewModel } from '../../models/DiffRowViewModel'
import { WidgetRow } from './WidgetRow'

// MOCKS
vi.mock('../viewers/shared-styles', () => ({
  getViewerStyles: vi.fn(() => ({
    widgetCell: { textAlign: 'left', pointerEvents: 'auto', userSelect: 'text' },
    leftNumberCell: {
      empty: [{ textAlign: 'center', userSelect: 'none' }],
    },
    rightNumberCell: {
      empty: [{ textAlign: 'center', userSelect: 'none' }],
    },
    codeCell: {
      empty: [{ textAlign: 'left', padding: '0 8px', background: 'transparent' }],
    },
  })),
}))

// HELPERS
const createMockDiffLineViewModel = (overrides: Partial<DiffLineViewModel> = {}): DiffLineViewModel => {
  return new DiffLineViewModel(
    overrides.typeLeft ?? 'context',
    overrides.contentLeft ?? 'test content left',
    overrides.highlightedContentLeft ?? 'test content left',
    overrides.lineNumberLeft ?? 1,
    overrides.typeRight ?? 'context',
    overrides.contentRight ?? 'test content right',
    overrides.highlightedContentRight ?? 'test content right',
    overrides.lineNumberRight ?? 2,
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

const createMockDiffRowViewModel = (
  overrides: Partial<{
    line: DiffLineViewModel
    widgets: Widget[]
  }> = {},
): DiffRowViewModel => {
  const line = overrides.line ?? createMockDiffLineViewModel()
  const widgets = overrides.widgets ?? []
  return new DiffRowViewModel(line, widgets)
}

const createWidgetRowProps = createPropsFactory<{
  viewModel: DiffRowViewModel
  pos: 'top' | 'bottom'
  unified: boolean
}>({
  viewModel: createMockDiffRowViewModel(),
  pos: 'top',
  unified: false,
})

describe('WidgetRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('unified view rendering', () => {
    it('given unified view with top widgets, when rendered, expect single column spanning all 3 columns', () => {
      // GIVEN
      const widget = createMockWidget({ position: 'top', side: 'left' })
      const viewModel = createMockDiffRowViewModel({ widgets: [widget] })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: true })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      const cell = row.querySelector('td')
      expect(cell).toHaveAttribute('colspan', '3')
      expect(screen.getByTestId('widget')).toBeInTheDocument()
    })

    it('given unified view with bottom widgets, when rendered, expect single column spanning all 3 columns', () => {
      // GIVEN
      const lineViewModel = createMockDiffLineViewModel({ lineNumberLeft: 1 })
      const widget = createMockWidget({ position: 'bottom', side: 'left', line: 1 })
      const viewModel = createMockDiffRowViewModel({ line: lineViewModel, widgets: [widget] })
      const props = createWidgetRowProps({ viewModel, pos: 'bottom', unified: true })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      const cell = row.querySelector('td')
      expect(cell).toHaveAttribute('colspan', '3')
      expect(screen.getByTestId('widget')).toBeInTheDocument()
    })

    it('given unified view with multiple widgets, when rendered, expect each widget in separate row', () => {
      // GIVEN
      const lineViewModel = createMockDiffLineViewModel({ lineNumberLeft: 1 })
      const widget1 = createMockWidget({ position: 'top', side: 'left', line: 1 })
      const widget2 = createMockWidget({ position: 'top', side: 'left', line: 1 })
      const viewModel = createMockDiffRowViewModel({ line: lineViewModel, widgets: [widget1, widget2] })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: true })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(2)
      rows.forEach((row) => {
        const cell = row.querySelector('td')
        expect(cell).toHaveAttribute('colspan', '3')
      })
    })
  })

  describe('split view rendering - left widgets', () => {
    it('given split view with left top widget, when rendered, expect widget spans first 2 columns', () => {
      // GIVEN
      const widget = createMockWidget({ position: 'top', side: 'left' })
      const viewModel = createMockDiffRowViewModel({ widgets: [widget] })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      const cells = row.querySelectorAll('td')
      expect(cells).toHaveLength(3)
      expect(cells[0]).toHaveAttribute('colspan', '2')
      expect(cells[1]).toBeInTheDocument() // Empty cell
      expect(cells[2]).toBeInTheDocument() // Empty cell
      expect(screen.getByTestId('widget')).toBeInTheDocument()
    })

    it('given split view with left bottom widget, when rendered, expect widget spans first 2 columns', () => {
      // GIVEN
      const widget = createMockWidget({ position: 'bottom', side: 'left' })
      const viewModel = createMockDiffRowViewModel({ widgets: [widget] })
      const props = createWidgetRowProps({ viewModel, pos: 'bottom', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      const cells = row.querySelectorAll('td')
      expect(cells).toHaveLength(3)
      expect(cells[0]).toHaveAttribute('colspan', '2')
      expect(screen.getByTestId('widget')).toBeInTheDocument()
    })
  })

  describe('split view rendering - right widgets', () => {
    it('given split view with right top widget, when rendered, expect widget spans last 2 columns', () => {
      // GIVEN
      const lineViewModel = createMockDiffLineViewModel({ lineNumberRight: 2 })
      const widget = createMockWidget({ position: 'top', side: 'right', line: 2 })
      const viewModel = createMockDiffRowViewModel({ line: lineViewModel, widgets: [widget] })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      const cells = row.querySelectorAll('td')
      expect(cells).toHaveLength(3)
      expect(cells[0]).toBeInTheDocument() // Empty cell
      expect(cells[1]).toBeInTheDocument() // Empty cell
      expect(cells[2]).toHaveAttribute('colspan', '2')
      expect(screen.getByTestId('widget')).toBeInTheDocument()
    })

    it('given split view with right bottom widget, when rendered, expect widget spans last 2 columns', () => {
      // GIVEN
      const lineViewModel = createMockDiffLineViewModel({ lineNumberRight: 2 })
      const widget = createMockWidget({ position: 'bottom', side: 'right', line: 2 })
      const viewModel = createMockDiffRowViewModel({ line: lineViewModel, widgets: [widget] })
      const props = createWidgetRowProps({ viewModel, pos: 'bottom', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      const cells = row.querySelectorAll('td')
      expect(cells).toHaveLength(3)
      expect(cells[2]).toHaveAttribute('colspan', '2')
      expect(screen.getByTestId('widget')).toBeInTheDocument()
    })
  })

  describe('multiple widgets in split view', () => {
    it('given split view with left and right widgets, when rendered, expect separate rows for each widget', () => {
      // GIVEN
      const lineViewModel = createMockDiffLineViewModel({ lineNumberLeft: 1, lineNumberRight: 2 })
      const leftWidget = createMockWidget({ position: 'top', side: 'left', line: 1 })
      const rightWidget = createMockWidget({ position: 'top', side: 'right', line: 2 })
      const viewModel = createMockDiffRowViewModel({ line: lineViewModel, widgets: [leftWidget, rightWidget] })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(2)

      // First row should be left widget
      const leftRow = rows[0]
      const leftCells = leftRow.querySelectorAll('td')
      expect(leftCells[0]).toHaveAttribute('colspan', '2')

      // Second row should be right widget
      const rightRow = rows[1]
      const rightCells = rightRow.querySelectorAll('td')
      expect(rightCells[2]).toHaveAttribute('colspan', '2')
    })
  })

  describe('widget filtering by position', () => {
    it('given viewModel with top and bottom widgets, when rendering top position, expect only top widgets', () => {
      // GIVEN
      const topWidget = createMockWidget({ position: 'top', side: 'left' })
      const bottomWidget = createMockWidget({ position: 'bottom', side: 'right' })
      const viewModel = createMockDiffRowViewModel({ widgets: [topWidget, bottomWidget] })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(1) // Only top widget should be rendered
    })

    it('given viewModel with top and bottom widgets, when rendering bottom position, expect only bottom widgets', () => {
      // GIVEN
      const lineViewModel = createMockDiffLineViewModel({ lineNumberLeft: 1, lineNumberRight: 2 })
      const topWidget = createMockWidget({ position: 'top', side: 'left', line: 1 })
      const bottomWidget = createMockWidget({ position: 'bottom', side: 'right', line: 2 })
      const viewModel = createMockDiffRowViewModel({ line: lineViewModel, widgets: [topWidget, bottomWidget] })
      const props = createWidgetRowProps({ viewModel, pos: 'bottom', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(1) // Only bottom widget should be rendered
    })
  })

  describe('widget filtering by line number', () => {
    it('given viewModel with widgets for different lines, when rendering, expect only matching line widgets', () => {
      // GIVEN
      const lineViewModel = createMockDiffLineViewModel({ lineNumberLeft: 5, lineNumberRight: 6 })
      const matchingWidget = createMockWidget({ position: 'top', side: 'left', line: 5 })
      const nonMatchingWidget = createMockWidget({ position: 'top', side: 'left', line: 10 })
      const viewModel = createMockDiffRowViewModel({
        line: lineViewModel,
        widgets: [matchingWidget, nonMatchingWidget],
      })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(1) // Only matching widget should be rendered
    })

    it('given viewModel with right side widget, when rendering, expect widget filtered by right line number', () => {
      // GIVEN
      const lineViewModel = createMockDiffLineViewModel({ lineNumberLeft: 5, lineNumberRight: 6 })
      const rightWidget = createMockWidget({ position: 'top', side: 'right', line: 6 })
      const viewModel = createMockDiffRowViewModel({
        line: lineViewModel,
        widgets: [rightWidget],
      })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(1) // Widget should be rendered
    })

    it('given viewModel with left side widget but wrong line number, when rendering, expect no widgets', () => {
      // GIVEN
      const lineViewModel = createMockDiffLineViewModel({ lineNumberLeft: 5, lineNumberRight: 6 })
      const wrongLineWidget = createMockWidget({ position: 'top', side: 'left', line: 10 })
      const viewModel = createMockDiffRowViewModel({
        line: lineViewModel,
        widgets: [wrongLineWidget],
      })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      expect(screen.queryByRole('row')).not.toBeInTheDocument()
    })
  })

  describe('empty widget scenarios', () => {
    it('given viewModel with no widgets, when rendered, expect no rows', () => {
      // GIVEN
      const viewModel = createMockDiffRowViewModel({ widgets: [] })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      expect(screen.queryByRole('row')).not.toBeInTheDocument()
    })

    it('given viewModel with no matching position widgets, when rendered, expect no rows', () => {
      // GIVEN
      const widget = createMockWidget({ position: 'bottom' })
      const viewModel = createMockDiffRowViewModel({ widgets: [widget] })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      expect(screen.queryByRole('row')).not.toBeInTheDocument()
    })
  })

  describe('key generation', () => {
    it('given unified view widget, when rendered, expect correct key format', () => {
      // GIVEN
      const lineViewModel = createMockDiffLineViewModel({ lineNumberLeft: 5 })
      const widget = createMockWidget({ position: 'top', side: 'left', line: 5 })
      const viewModel = createMockDiffRowViewModel({ line: lineViewModel, widgets: [widget] })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: true })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      expect(row).toBeInTheDocument() // Key should be unique and valid
    })

    it('given split view left widget, when rendered, expect correct key format', () => {
      // GIVEN
      const lineViewModel = createMockDiffLineViewModel({ lineNumberLeft: 5 })
      const widget = createMockWidget({ position: 'top', side: 'left', line: 5 })
      const viewModel = createMockDiffRowViewModel({ line: lineViewModel, widgets: [widget] })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      expect(row).toBeInTheDocument() // Key should be unique and valid
    })

    it('given split view right widget, when rendered, expect correct key format', () => {
      // GIVEN
      const lineViewModel = createMockDiffLineViewModel({ lineNumberRight: 6 })
      const widget = createMockWidget({ position: 'top', side: 'right', line: 6 })
      const viewModel = createMockDiffRowViewModel({ line: lineViewModel, widgets: [widget] })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      expect(row).toBeInTheDocument() // Key should be unique and valid
    })
  })

  describe('theme integration', () => {
    it('given component rendered, when theme context used, expect styles applied', () => {
      // GIVEN
      const widget = createMockWidget({ position: 'top', side: 'left' })
      const viewModel = createMockDiffRowViewModel({ widgets: [widget] })
      const props = createWidgetRowProps({ viewModel, pos: 'top', unified: false })

      // WHEN
      render(<WidgetRow {...props} />)

      // EXPECT
      const row = screen.getByRole('row')
      expect(row).toBeInTheDocument()
    })
  })
})
