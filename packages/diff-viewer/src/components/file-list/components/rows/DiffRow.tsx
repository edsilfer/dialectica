import { Interpolation, Theme } from '@emotion/react'
import React, { useMemo } from 'react'
import { Widget } from '../../../../models/LineExtensions'
import { LineMetadata } from '../../models/LineMetadata'
import { Row } from '../../models/Row'
import { HunkDirection } from '../../models/types'
import { HunkRow } from './HunkRow'
import { SplitRow } from './SplitRow'
import { UnifiedRow } from './UnifiedRow'
import { WidgetRow } from './WidgetRow'

export interface BaseRowProps {
  /** The row index */
  idx: number
  /** The line data to render */
  line: LineMetadata
  /** The view model for this row */
  viewModel: Row
  /** Whether this is a hunk row */
  isHunk: boolean
  /** CSS class name for the cells */
  className?: string
  /** CSS styles for the row */
  css?: Interpolation<Theme>
  /** The currently selected row indices. */
  selectedRows?: Set<number>
  /** Overlay groups to render */
  overlays: Record<number, React.ReactNode[]>
  /** Widgets to render */
  widgets?: Widget[]
  /** Whether to render as unified view */
  unified?: boolean
  /** Whether this row is highlighted */
  isHighlighted?: boolean

  /** Function to load more lines */
  loadLines?: (line: LineMetadata, direction: HunkDirection) => void
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

export const DiffRow: React.FC<Omit<BaseRowProps, 'viewModel'>> = (props) => {
  const viewModel = useMemo(() => new Row(props.line, props.widgets ?? []), [props.line, props.widgets])
  const RowComponent = props.unified ? (props.isHunk ? HunkRow : UnifiedRow) : props.isHunk ? HunkRow : SplitRow

  const isHighlighted = props.selectedRows?.has(props.idx) ?? false
  const firstHighlighted = Math.min(...(props.selectedRows ?? [])) === props.idx
  const lastHighlighted = Math.max(...(props.selectedRows ?? [])) === props.idx

  const classes = Array.of(
    props.className,
    isHighlighted ? 'highlighted-row' : '',
    firstHighlighted ? 'first-highlighted-row' : '',
    lastHighlighted ? 'last-highlighted-row' : '',
  ).join(' ')

  return (
    <>
      {/* widgets *above* the diff line */}
      <WidgetRow viewModel={viewModel} pos="top" unified={props.unified ?? false} />

      <RowComponent
        flavor={props.unified ? 'unified' : 'split'}
        {...props}
        viewModel={viewModel}
        className={classes}
        isHighlighted={isHighlighted}
      />

      {/* widgets *below* the diff line */}
      <WidgetRow viewModel={viewModel} pos="bottom" unified={props.unified ?? false} />
    </>
  )
}
