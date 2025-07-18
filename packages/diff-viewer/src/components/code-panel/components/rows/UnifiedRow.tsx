import { theme as antTheme } from 'antd'
import React, { useContext, useMemo } from 'react'
import { ThemeContext } from '../../../../themes/providers/theme-context'
import { getViewerStyles } from '../viewers/shared-styles'
import { PREFIX } from './constants'
import { classes } from './row-utils'
import { UnifiedRowProps } from './types'

export const UnifiedRow: React.FC<UnifiedRowProps> = (props) => {
  const theme = useContext(ThemeContext)
  const { token: antdThemeToken } = antTheme.useToken()
  const styles = useMemo(() => getViewerStyles(theme, antdThemeToken), [theme, antdThemeToken])

  const isHighlighted = (props.selectedRows ?? new Set()).has(props.idx) && props.viewModel.getLineType() !== 'empty'
  const _classes = useMemo(() => classes('diff-cell', isHighlighted ? 'highlighted' : ''), [isHighlighted])

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
        css={styles.leftNumberCell[props.viewModel.getLineType()]}
        data-side="left"
        className={_classes}
        data-line={props.line.lineNumberLeft}
        onMouseDown={() => handleMouseDown(props.idx, 'left')}
        onMouseEnter={() => handleMouseEnter(props.idx)}
        onMouseUp={handleMouseUp}
      >
        {props.viewModel.getLineNumber()}
        <div css={styles.overlay} className="diff-view-overlay">
          {props.overlays[0]}
        </div>
      </td>

      <td
        css={styles.rightNumberCell[props.viewModel.getLineType()]}
        data-side="right"
        className={_classes}
        data-line={props.line.lineNumberRight}
        onMouseDown={() => handleMouseDown(props.idx, 'right')}
        onMouseEnter={() => handleMouseEnter(props.idx)}
        onMouseUp={handleMouseUp}
      >
        {props.line.lineNumberRight}
        <div css={styles.overlay} className="diff-view-overlay">
          {props.overlays[1]}
        </div>
      </td>

      <td css={styles.codeCell[props.viewModel.getLineType()]} className={_classes}>
        <span css={styles.lineType}>{PREFIX[props.viewModel.getLineType()]}</span>
        <span dangerouslySetInnerHTML={{ __html: props.viewModel.getContent() }} />
        <div css={styles.overlay} className="diff-view-overlay">
          {props.overlays[2]}
        </div>
      </td>
    </tr>
  )
}
