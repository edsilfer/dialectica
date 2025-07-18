import { Interpolation, Theme } from '@emotion/react'
import React from 'react'
import { DiffLineViewModel } from '../../models/DiffLineViewModel'
import { DiffRowViewModel } from '../../models/DiffRowViewModel'
import { HunkDirection, Widget } from '../viewers/types'

/** Base props for all row types */
export interface BaseRowProps {
  /** The row index */
  idx: number
  /** The line data to render */
  line: DiffLineViewModel
  /** The view model for this row */
  viewModel: DiffRowViewModel
  /** CSS class name for the cells */
  className?: string
  /** CSS styles for the row */
  css?: Interpolation<Theme>
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

/** Props for regular rows (both unified and split) */
export interface RegularRowProps extends BaseRowProps {
  /** Overlay groups to render */
  overlays: Record<number, React.ReactNode[]>
}

/** Props for hunk rows */
export interface HunkRowProps extends BaseRowProps {
  /** Widgets to render */
  widgets?: Widget[]
}

/** Props for split view regular rows */
export interface SplitRowProps extends RegularRowProps {
  /** Whether to render as unified view */
  unified?: boolean
}

/** Props for unified view regular rows */
export interface UnifiedRowProps extends RegularRowProps {
  /** Whether to render as unified view */
  unified?: boolean
}

/** Props for split view hunk rows */
export interface SplitHunkRowProps extends HunkRowProps {
  /** Whether to render as unified view */
  unified?: boolean
}

/** Props for unified view hunk rows */
export interface UnifiedHunkRowProps extends HunkRowProps {
  /** Whether to render as unified view */
  unified?: boolean
}
