import { ThemeContext } from '@dialectica-org/commons'
import { theme as antTheme } from 'antd'
import React, { useContext, useMemo } from 'react'
import { Side } from '../../models/types'
import { getViewerStyles } from '../viewers/shared-styles'
import { CodeSpan } from './CodeSpan'
import { PREFIX } from './constants'
import { BaseRowProps } from './DiffRow'

const SIDE_CLASSES: Record<Side, string> = {
  left: 'split-viewer-left-row',
  right: 'split-viewer-right-row',
}

const MouseHandlerContext = React.createContext<{
  onMouseDown?: (index: number, side: Side) => void
  onMouseEnter?: (index: number) => void
  onMouseUp?: () => void
}>({})

export const SplitRow: React.FC<BaseRowProps> = (props) => {
  const theme = useContext(ThemeContext)
  const { token: antdThemeToken } = antTheme.useToken()
  const styles = useMemo(() => getViewerStyles(theme, antdThemeToken), [theme, antdThemeToken])

  return (
    <MouseHandlerContext.Provider
      value={{
        onMouseDown: (index, side) => props.onRowSelectionStart?.(index, side),
        onMouseEnter: (index) => props.onRowSelectionUpdate?.(index),
        onMouseUp: props.onRowSelectionEnd,
      }}
    >
      <tr
        className={props.className}
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
        data-idx={props.idx}
        css={[styles.row]}
      >
        <SidePanel {...props} side="left" isHighlighted={props.isHighlighted} />
        <SidePanel {...props} side="right" isHighlighted={props.isHighlighted} />
      </tr>
    </MouseHandlerContext.Provider>
  )
}

const SidePanel: React.FC<BaseRowProps & { side: Side; isHighlighted?: boolean }> = (props) => {
  const theme = useContext(ThemeContext)
  const { token: antdThemeToken } = antTheme.useToken()
  const styles = useMemo(() => getViewerStyles(theme, antdThemeToken), [theme, antdThemeToken])
  const { onMouseDown, onMouseEnter, onMouseUp } = useContext(MouseHandlerContext)

  const lineType = props.viewModel.getLineType(props.side)
  const classes = Array.of(
    SIDE_CLASSES[props.side],
    'diff-cell',
    props.isHighlighted && lineType !== 'empty' ? 'highlighted' : '',
  ).join(' ')
  const numberCellStyles = props.side === 'left' ? styles.leftNumberCell : styles.rightNumberCell

  return (
    <>
      {/* Number cell */}
      <td
        css={numberCellStyles[lineType]}
        className={classes}
        onMouseDown={() => onMouseDown?.(props.idx, props.side)}
        onMouseEnter={() => onMouseEnter?.(props.idx)}
        onMouseUp={onMouseUp}
      >
        {props.viewModel.getLineNumber(props.side)}

        {lineType !== 'empty' && (
          <div css={styles.overlay} className="diff-view-overlay">
            {props.overlays?.[0]}
          </div>
        )}
      </td>

      {/* Code cell */}
      <td css={styles.codeCell[lineType]} className={classes}>
        <span css={styles.lineType} style={{ userSelect: 'none', marginRight: '0.5rem' }}>
          {PREFIX[lineType]}
        </span>
        <CodeSpan row={props.viewModel} side={props.side} />
        {lineType !== 'empty' && (
          <div css={styles.overlay} className="diff-view-overlay">
            {props.overlays?.[1]}
          </div>
        )}
      </td>
    </>
  )
}
