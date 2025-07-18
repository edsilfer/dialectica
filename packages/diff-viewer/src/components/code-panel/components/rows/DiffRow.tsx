import { Interpolation, Theme } from '@emotion/react'
import React, { useMemo } from 'react'
import { DiffLineViewModel } from '../../models/DiffLineViewModel'
import { DiffRowViewModel } from '../../models/DiffRowViewModel'
import { HunkDirection, Widget } from '../viewers/types'
import { SplitHunkRow } from './SplitHunkRow'
import { SplitRow } from './SplitRow'
import { UnifiedHunkRow } from './UnifiedHunkRow'
import { UnifiedRow } from './UnifiedRow'
import { WidgetRow } from './WidgetRow'
import { classes } from './row-utils'

export interface DiffRowProps {
  /** The row index */
  idx: number
  /** The line data to render */
  line: DiffLineViewModel
  /** Whether this is a hunk row */
  isHunk: boolean
  /** Overlay groups to render */
  overlays: Record<number, React.ReactNode[]>
  /** Widgets to render */
  widgets?: Widget[]
  /** CSS class name for the cells */
  className?: string
  /** Whether to render as unified view (includes both number cells) */
  unified?: boolean
  /** CSS styles for the row */
  css?: Interpolation<Theme>
  /** Children elements */
  children?: React.ReactNode
  /** The currently selected row indices. */
  selectedRows?: Set<number>

  /** Function to load more lines */
  loadLines?: (line: DiffLineViewModel, direction: HunkDirection) => void
  /** Function to handle mouse enter */
  onMouseEnter?: (e: React.MouseEvent<HTMLTableRowElement>) => void
  /** Function to handle mouse leave */
  onMouseLeave?: (e: React.MouseEvent<HTMLTableRowElement>) => void
  /** Called when user starts selecting rows (mouse down). */
  onRowSelectionStart?: (index: number, side: 'left' | 'right') => void
  /** Called when user continues selecting rows (mouse enter during drag). */
  onRowSelectionUpdate?: (index: number) => void
  /** Called when user ends row selection (mouse up). */
  onRowSelectionEnd?: () => void
}

export const DiffRow: React.FC<DiffRowProps> = (props) => {
  const viewModel = useMemo(() => new DiffRowViewModel(props.line, props.widgets ?? []), [props.line, props.widgets])
  const Row = props.unified ? (props.isHunk ? UnifiedHunkRow : UnifiedRow) : props.isHunk ? SplitHunkRow : SplitRow

  const isHighlighted = props.selectedRows?.has(props.idx) ?? false
  const firstHighlighted = Math.min(...(props.selectedRows ?? [])) === props.idx
  const lastHighlighted = Math.max(...(props.selectedRows ?? [])) === props.idx

  const _classes = classes(
    props.className,
    isHighlighted ? 'highlighted-row' : '',
    firstHighlighted ? 'first-highlighted-row' : '',
    lastHighlighted ? 'last-highlighted-row' : '',
  )

  return (
    <>
      {/* widgets *above* the diff line */}
      <WidgetRow viewModel={viewModel} pos="top" unified={props.unified ?? false} />

      <Row {...props} viewModel={viewModel} className={_classes} />

      {/* widgets *below* the diff line */}
      <WidgetRow viewModel={viewModel} pos="bottom" unified={props.unified ?? false} />
    </>
  )
}
