import { theme as antTheme } from 'antd'
import React, { useContext, useMemo } from 'react'
import { ThemeContext } from '../../../../themes/providers/theme-context'
import LoadMoreButton from '../../../ui/buttons/LoadMoreButton'
import { getViewerStyles } from '../viewers/shared-styles'
import { UnifiedHunkRowProps } from './types'

export const UnifiedHunkRow: React.FC<UnifiedHunkRowProps> = (props) => {
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
        <span css={styles.lineType}> </span>
        <span dangerouslySetInnerHTML={{ __html: props.viewModel.getContent() }} />
      </td>
    </tr>
  )
}
