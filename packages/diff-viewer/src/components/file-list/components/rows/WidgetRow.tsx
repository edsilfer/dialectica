import { ThemeContext } from '@commons'
import { theme as antTheme } from 'antd'
import React, { useContext, useMemo } from 'react'
import { Row } from '../../models/Row'
import { getViewerStyles } from '../viewers/shared-styles'

export interface WidgetRowProps {
  /** The view model for this row */
  viewModel: Row
  /** Position of widgets (top or bottom) */
  pos: 'top' | 'bottom'
  /** Whether to render as unified view */
  unified: boolean
}

export const WidgetRow: React.FC<WidgetRowProps> = (props) => {
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
