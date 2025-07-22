import LoadMoreButton from '@commons'
import { theme as antTheme } from 'antd'
import React, { useContext, useMemo } from 'react'
import { ThemeContext } from '../../../../../../commons/src/themes/providers/theme-context'
import { getViewerStyles } from '../viewers/shared-styles'
import { SplitHunkRowProps } from './types'

export const SplitHunkRow: React.FC<SplitHunkRowProps> = (props) => {
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
