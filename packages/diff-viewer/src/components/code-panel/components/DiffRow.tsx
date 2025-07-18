import { Interpolation, Theme } from '@emotion/react'
import React, { useContext, useMemo } from 'react'
import { ThemeContext } from '../../../themes/providers/theme-context'
import { LineRange } from '../../diff-viewer/types'
import LoadMoreButton from '../../ui/buttons/LoadMoreButton'
import { DiffLineViewModel } from '../models/DiffLineViewModel'
import { DiffRowViewModel } from '../models/DiffRowViewModel'
import { getViewerStyles } from './shared-styles'
import { DiffLineType, HunkDirection, Widget } from './types'
import { theme as antTheme } from 'antd'

const PREFIX: Record<DiffLineType, string> = {
  add: '+',
  delete: '-',
  context: ' ',
  hunk: ' ',
  empty: ' ',
}

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
  /** The line range to highlight */
  highlightedLines?: LineRange

  /** Function to load more lines */
  loadLines?: (line: DiffLineViewModel, direction: HunkDirection) => void
  /** Function to handle mouse enter */
  onMouseEnter?: (e: React.MouseEvent<HTMLTableRowElement>) => void
  /** Function to handle mouse leave */
  onMouseLeave?: (e: React.MouseEvent<HTMLTableRowElement>) => void
}

export const DiffRow: React.FC<DiffRowProps> = (props) => {
  const viewModel = useMemo(() => new DiffRowViewModel(props.line, props.widgets ?? []), [props.line, props.widgets])
  const Row = props.unified ? (props.isHunk ? UnifiedHunkRow : UnifiedRow) : props.isHunk ? SplitHunkRow : SplitRow

  // Check if this line should be highlighted
  const isHighlighted = useMemo(() => {
    if (!props.highlightedLines) return false

    const lineNumber = props.unified
      ? (props.line.lineNumberRight ?? props.line.lineNumberLeft)
      : props.highlightedLines.side === 'left'
        ? props.line.lineNumberLeft
        : props.line.lineNumberRight

    if (!lineNumber) return false

    return lineNumber >= props.highlightedLines.start && lineNumber <= props.highlightedLines.end
  }, [props.highlightedLines, props.line, props.unified])

  return (
    <>
      {/* widgets *above* the diff line */}
      <WidgetRow viewModel={viewModel} pos="top" unified={props.unified ?? false} />

      <Row {...props} viewModel={viewModel} isHighlighted={isHighlighted} />

      {/* widgets *below* the diff line */}
      <WidgetRow viewModel={viewModel} pos="bottom" unified={props.unified ?? false} />
    </>
  )
}

const WidgetRow: React.FC<{ viewModel: DiffRowViewModel; pos: 'top' | 'bottom'; unified: boolean }> = (props) => {
  const widgets = props.pos === 'top' ? props.viewModel.topWidgets : props.viewModel.bottomWidgets
  const theme = useContext(ThemeContext)
  const { token: antdThemeToken } = antTheme.useToken()
  const styles = useMemo(() => getViewerStyles(theme, antdThemeToken), [theme, antdThemeToken])

  return (
    <>
      {widgets.map((widget, index) => {
        if (props.unified) {
          // Unified view: single column spans all 3 columns
          return (
            <tr key={`widget-${props.pos}-${props.viewModel.getLineNumber()}-${index}`}>
              <td colSpan={3}>{widget.content}</td>
            </tr>
          )
        } else {
          if (widget.side === 'left') {
            // Left widget: spans first 2 columns (left number + left code)
            return (
              <tr key={`widget-${props.pos}-${props.viewModel.getLineNumber('left')}-${index}`}>
                <td colSpan={2} css={styles.widgetCell}>
                  {widget.content}
                </td>
                <td css={styles.rightNumberCell['empty']}>&nbsp;</td>
                <td css={styles.codeCell['empty']}>&nbsp;</td>
              </tr>
            )
          } else {
            // Right widget: spans last 2 columns (right number + right code)
            return (
              <tr key={`widget-${props.pos}-${props.viewModel.getLineNumber('right')}-${index}`}>
                <td css={styles.leftNumberCell['empty']}>&nbsp;</td>
                <td css={styles.codeCell['empty']}>&nbsp;</td>
                <td css={[styles.rightNumberCell['empty'], styles.widgetCell]} colSpan={2}>
                  {widget.content}
                </td>
              </tr>
            )
          }
        }
      })}
    </>
  )
}

// UNIFIED VIEWER _________________________________________________________________________________
const UnifiedHunkRow: React.FC<DiffRowProps & { viewModel: DiffRowViewModel; isHighlighted?: boolean }> = (props) => {
  const theme = useContext(ThemeContext)
  const { token: antdThemeToken } = antTheme.useToken()
  const styles = useMemo(() => getViewerStyles(theme, antdThemeToken), [theme, antdThemeToken])

  return (
    <tr
      key={props.idx}
      className={props.className}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      data-idx={props.idx}
      css={[styles.row, styles.hunkRow]}
    >
      <td css={styles.leftNumberCell['hunk']} colSpan={2}>
        <LoadMoreButton
          direction={props.line?.hunkDirection ?? 'out'}
          onClick={(_, d) => props.loadLines?.(props.line, d)}
        />
      </td>
      <td css={styles.codeCell['hunk']}>
        <span css={styles.lineType}>{PREFIX['hunk']}</span>
        <span dangerouslySetInnerHTML={{ __html: props.viewModel.getContent() }} />
      </td>
    </tr>
  )
}

const UnifiedRow: React.FC<DiffRowProps & { viewModel: DiffRowViewModel; isHighlighted?: boolean }> = (props) => {
  const theme = useContext(ThemeContext)
  const { token: antdThemeToken } = antTheme.useToken()
  const styles = useMemo(() => getViewerStyles(theme, antdThemeToken), [theme, antdThemeToken])

  return (
    <tr
      key={props.idx}
      className={[props.className, props.isHighlighted && 'highlighted-row'].filter(Boolean).join(' ')}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      data-idx={props.idx}
      css={[styles.row]}
    >
      <td css={styles.leftNumberCell[props.viewModel.getLineType()]}>
        {props.viewModel.getLineNumber()}
        <div css={styles.overlay} className="diff-view-overlay">
          {props.overlays[0]}
        </div>
      </td>

      <td css={styles.rightNumberCell[props.viewModel.getLineType()]}>
        {props.line.lineNumberRight}
        <div css={styles.overlay} className="diff-view-overlay">
          {props.overlays[1]}
        </div>
      </td>

      <td css={styles.codeCell[props.viewModel.getLineType()]}>
        <span css={styles.lineType}>{PREFIX[props.viewModel.getLineType()]}</span>
        <span dangerouslySetInnerHTML={{ __html: props.viewModel.getContent() }} />
        <div css={styles.overlay} className="diff-view-overlay">
          {props.overlays[2]}
        </div>
      </td>
    </tr>
  )
}

// SPLIT VIEWER ___________________________________________________________________________________
const SplitHunkRow: React.FC<DiffRowProps & { viewModel: DiffRowViewModel; isHighlighted?: boolean }> = (props) => {
  const theme = useContext(ThemeContext)
  const { token: antdThemeToken } = antTheme.useToken()
  const styles = useMemo(() => getViewerStyles(theme, antdThemeToken), [theme, antdThemeToken])

  return (
    <tr
      className={props.className}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      data-idx={props.idx}
      css={[styles.row, styles.hunkRow]}
    >
      {/* LEFT NUMBER CELL */}
      <td css={styles.leftNumberCell['hunk']} className={props.className} style={{ userSelect: 'none' }}>
        <LoadMoreButton
          direction={props.line?.hunkDirection ?? 'out'}
          onClick={(_, direction) => {
            props.loadLines?.(props.line, direction)
          }}
        />
      </td>

      {/* MERGED CODE CELL (spans remaining 3 columns) */}
      <td css={styles.codeCell['hunk']} colSpan={3}>
        <span css={styles.lineType}> </span>
        <span
          dangerouslySetInnerHTML={{
            __html: props.line.highlightedContentLeft ?? props.line.highlightedContentRight ?? '&nbsp;',
          }}
        />
      </td>
    </tr>
  )
}

const SplitRow: React.FC<DiffRowProps & { viewModel: DiffRowViewModel; isHighlighted?: boolean }> = (props) => {
  const theme = useContext(ThemeContext)
  const { token: antdThemeToken } = antTheme.useToken()
  const styles = useMemo(() => getViewerStyles(theme, antdThemeToken), [theme, antdThemeToken])
  const leftType: DiffLineType = props.line.typeLeft ?? 'empty'
  const rightType: DiffLineType = props.line.typeRight ?? 'empty'
  const isHunk = leftType === 'hunk' && rightType === 'hunk'

  if (isHunk) {
    return <SplitHunkRow {...props} viewModel={props.viewModel} />
  }

  return (
    <tr
      className={[props.className, props.isHighlighted && `highlighted-row`].filter(Boolean).join(' ')}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      data-idx={props.idx}
      css={[styles.row]}
    >
      {/* Left side */}
      <td
        css={styles.leftNumberCell[leftType]}
        className="split-viewer-left-row"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {props.line.lineNumberLeft}
        <div css={styles.overlay} className="diff-view-overlay">
          {props.overlays?.[0]}
        </div>
      </td>
      <td css={styles.codeCell[leftType]} className="split-viewer-left-row">
        <span css={styles.lineType} style={{ userSelect: 'none' }}>
          {PREFIX[leftType]}
        </span>
        <span dangerouslySetInnerHTML={{ __html: props.line.highlightedContentLeft ?? '&nbsp;' }} />
        <div css={styles.overlay} className="diff-view-overlay">
          {props.overlays?.[1]}
        </div>
      </td>

      {/* Right side */}
      <td css={styles.rightNumberCell[rightType]} className="split-viewer-right-row">
        {props.line.lineNumberRight}
        <div css={styles.overlay} className="diff-view-overlay">
          {props.overlays?.[0]}
        </div>
      </td>
      <td css={styles.codeCell[rightType]} className="split-viewer-right-row">
        <span css={styles.lineType} style={{ userSelect: 'none' }}>
          {PREFIX[rightType]}
        </span>
        <span dangerouslySetInnerHTML={{ __html: props.line.highlightedContentRight ?? '&nbsp;' }} />
        <div css={styles.overlay} className="diff-view-overlay">
          {props.overlays?.[1]}
        </div>
      </td>
    </tr>
  )
}
