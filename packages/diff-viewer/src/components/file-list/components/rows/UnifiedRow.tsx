import { ThemeContext } from '@dialectica-org/commons'
import { theme as antTheme } from 'antd'
import React, { useContext, useMemo } from 'react'
import { getViewerStyles } from '../viewers/shared-styles'
import { CodeSpan } from './CodeSpan'
import { PREFIX } from './constants'
import { BaseRowProps } from './DiffRow'

export const UnifiedRow: React.FC<BaseRowProps> = (props) => {
  const theme = useContext(ThemeContext)
  const { token: antdThemeToken } = antTheme.useToken()
  const styles = useMemo(() => getViewerStyles(theme, antdThemeToken), [theme, antdThemeToken])

  const side = useMemo(() => {
    const line = props.viewModel.rawLine
    if (line.contentLeft === line.contentRight) return undefined
    if (line.contentLeft === null) return 'right'
    if (line.contentRight === null) return 'left'
    return undefined
  }, [props.viewModel])

  const classes = useMemo(
    () => Array.of('diff-cell', props.isHighlighted ? 'highlighted' : '').join(' '),
    [props.isHighlighted],
  )

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
      key={props.idx}
      className={props.className}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      data-idx={props.idx}
      css={[styles.row]}
    >
      <td
        css={styles.leftNumberCell[props.viewModel.getLineType(side)]}
        data-side="left"
        className={classes}
        data-line={props.line.lineNumberLeft}
        onMouseDown={() => handleMouseDown(props.idx, 'left')}
        onMouseEnter={() => handleMouseEnter(props.idx)}
        onMouseUp={handleMouseUp}
      >
        {props.viewModel.getLineNumber()}
        {props.viewModel.getLineType() !== 'empty' && (
          <div css={styles.overlay} className="diff-view-overlay">
            {props.overlays[0]}
          </div>
        )}
      </td>

      <td
        css={styles.rightNumberCell[props.viewModel.getLineType(side)]}
        data-side="right"
        className={classes}
        data-line={props.line.lineNumberRight}
        onMouseDown={() => handleMouseDown(props.idx, 'right')}
        onMouseEnter={() => handleMouseEnter(props.idx)}
        onMouseUp={handleMouseUp}
      >
        {props.line.lineNumberRight}
        {props.viewModel.getLineType(side) !== 'empty' && (
          <div css={styles.overlay} className="diff-view-overlay">
            {props.overlays[1]}
          </div>
        )}
      </td>

      <td css={styles.codeCell[props.viewModel.getLineType(side)]} className={classes}>
        <span css={styles.lineType} style={{ userSelect: 'none', marginRight: '0.5rem' }}>
          {PREFIX[props.viewModel.getLineType(side)]}
        </span>
        <CodeSpan row={props.viewModel} side={side} />
        {props.viewModel.getLineType(side) !== 'empty' && (
          <div css={styles.overlay} className="diff-view-overlay">
            {props.overlays[2]}
          </div>
        )}
      </td>
    </tr>
  )
}
