import { LoadMoreButton, ThemeContext } from '@dialectica-org/commons'
import { theme as antTheme } from 'antd'
import React, { useContext, useMemo } from 'react'
import { getViewerStyles } from '../viewers/shared-styles'
import { BaseRowProps } from './DiffRow'

export const HunkRow: React.FC<{ flavor: 'split' | 'unified' } & BaseRowProps> = (props) => {
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
      <td
        css={styles.leftNumberCell['hunk']}
        className={props.className}
        style={{ userSelect: 'none' }}
        colSpan={props.flavor === 'split' ? 1 : 2}
      >
        <LoadMoreButton
          direction={props.line?.hunkDirection ?? 'out'}
          onClick={(_, direction) => {
            props.loadLines?.(props.line, direction)
          }}
        />
      </td>

      {/* CODE CELL */}
      <td css={styles.codeCell['hunk']} colSpan={props.flavor === 'split' ? 3 : 1}>
        <span css={styles.lineType}> </span>
        <span
          dangerouslySetInnerHTML={{
            __html: props.viewModel.getContent(),
          }}
        />
      </td>
    </tr>
  )
}
