import { ThemeContext } from '@commons'
import { theme as antTheme } from 'antd'
import React, { useContext, useMemo } from 'react'
import { DiffLineViewModel } from '../../models/DiffLineViewModel'
import { getViewerStyles } from '../viewers/shared-styles'
import { DiffLineType } from '../viewers/types'
import { PREFIX } from './constants'
import { classes } from './row-utils'
import { SplitHunkRow } from './SplitHunkRow'
import { SplitRowProps } from './types'

const SIDE_CLASSES: Record<'left' | 'right', string> = {
  left: 'split-viewer-left-row',
  right: 'split-viewer-right-row',
}

export const SplitRow: React.FC<SplitRowProps> = (props) => {
  const theme = useContext(ThemeContext)
  const { token: antdThemeToken } = antTheme.useToken()
  const styles = useMemo(() => getViewerStyles(theme, antdThemeToken), [theme, antdThemeToken])

  const leftType: DiffLineType = props.line.typeLeft ?? 'empty'
  const rightType: DiffLineType = props.line.typeRight ?? 'empty'
  const isHunk = leftType === 'hunk' && rightType === 'hunk'

  if (isHunk) {
    return <SplitHunkRow {...props} viewModel={props.viewModel} />
  }

  const leftVM = new LineViewModel(props.line, 'left')
  const rightVM = new LineViewModel(props.line, 'right')

  const handleMouseDown = (index: number, side: 'left' | 'right') => {
    props.onRowSelectionStart?.(index, side)
  }

  const handleMouseEnter = (index: number) => {
    props.onRowSelectionUpdate?.(index)
  }

  const handleMouseUp = () => {
    props.onRowSelectionEnd?.()
  }

  return (
    <tr
      className={props.className}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      data-idx={props.idx}
      css={[styles.row]}
    >
      <Side
        idx={props.idx}
        side="left"
        lineViewModel={leftVM}
        overlays={props.overlays}
        selectedRows={props.selectedRows ?? new Set()}
        handleMouseDown={handleMouseDown}
        handleMouseEnter={handleMouseEnter}
        handleMouseUp={handleMouseUp}
      />
      <Side
        idx={props.idx}
        side="right"
        lineViewModel={rightVM}
        overlays={props.overlays}
        selectedRows={props.selectedRows ?? new Set()}
        handleMouseDown={handleMouseDown}
        handleMouseEnter={handleMouseEnter}
        handleMouseUp={handleMouseUp}
      />
    </tr>
  )
}

interface SideProps {
  /** Row index (zero‑based). */
  idx: number
  /** The side of the split row. */
  side: 'left' | 'right'
  /** The line view model for this side. */
  lineViewModel: LineViewModel
  /** The overlays. */
  overlays?: Record<number, React.ReactNode[]>
  /** The selected rows. */
  selectedRows: Set<number>
  /** The function to handle mouse down. */
  handleMouseDown: (index: number, side: 'left' | 'right') => void
  /** The function to handle mouse enter. */
  handleMouseEnter: (index: number) => void
  /** The function to handle mouse up. */
  handleMouseUp: () => void
}

const Side: React.FC<SideProps> = (props) => {
  const theme = useContext(ThemeContext)
  const { token: antdThemeToken } = antTheme.useToken()
  const styles = useMemo(() => getViewerStyles(theme, antdThemeToken), [theme, antdThemeToken])

  const isHighlighted = props.selectedRows.has(props.idx) && props.lineViewModel.getLineType() !== 'empty'
  const _classes = useMemo(
    () => classes(SIDE_CLASSES[props.side], 'diff-cell', isHighlighted ? 'highlighted' : ''),
    [props.side, isHighlighted],
  )
  const numberCellStyles = props.side === 'left' ? styles.leftNumberCell : styles.rightNumberCell

  return (
    <>
      {/* Number cell */}
      <td
        css={numberCellStyles[props.lineViewModel.getLineType()]}
        className={_classes}
        onMouseDown={() => props.handleMouseDown(props.idx, props.side)}
        onMouseEnter={() => props.handleMouseEnter(props.idx)}
        onMouseUp={props.handleMouseUp}
      >
        {props.lineViewModel.getLineNumber()}
        <div css={styles.overlay} className="diff-view-overlay">
          {props.overlays?.[0]}
        </div>
      </td>

      {/* Code cell */}
      <td css={styles.codeCell[props.lineViewModel.getLineType()]} className={_classes}>
        <span css={styles.lineType} style={{ userSelect: 'none' }}>
          {PREFIX[props.lineViewModel.getLineType()]}
        </span>
        <span dangerouslySetInnerHTML={{ __html: props.lineViewModel.getContent() ?? '&nbsp;' }} />
        <div css={styles.overlay} className="diff-view-overlay">
          {props.overlays?.[1]}
        </div>
      </td>
    </>
  )
}

export class LineViewModel {
  private vm: DiffLineViewModel
  private side: 'left' | 'right'

  constructor(line: DiffLineViewModel, side: 'left' | 'right') {
    this.vm = line
    this.side = side
  }

  getLineType(): DiffLineType {
    if (this.side === 'left') {
      return this.vm.typeLeft ?? 'empty'
    } else {
      return this.vm.typeRight ?? 'empty'
    }
  }

  getLineNumber(): number | null {
    if (this.side === 'left') {
      return this.vm.lineNumberLeft
    } else {
      return this.vm.lineNumberRight
    }
  }

  getContent(): string | null {
    if (this.side === 'left') {
      return this.vm.highlightedContentLeft
    } else {
      return this.vm.highlightedContentRight
    }
  }
}
