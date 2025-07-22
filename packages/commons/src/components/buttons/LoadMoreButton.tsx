import { css, SerializedStyles } from '@emotion/react'
import { Tooltip } from 'antd'
import React, { useContext } from 'react'
import { ThemeContext } from '../../themes/providers/theme-context'
import LoadMoreLines from '../icons/LoadMoreLines'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
    `,

    icon: css`
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;

      &:hover {
        background: ${theme.colors.accent};
        color: white;
        cursor: pointer;
      }
    `,
  }
}

type Direction = 'up' | 'down' | 'out' | 'in' | 'in_up' | 'in_down'

export interface LoadMoreButtonProps {
  /** The direction of the load more arrows */
  direction: Direction
  /** Optional custom styles to apply to the icons */
  css?: SerializedStyles
  /** The width of the icons */
  width?: number
  /** The height of the icons */
  height?: number

  /** The function to call when the load more button is clicked */
  onClick?: (event: React.MouseEvent, direction: Direction) => void
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = (props) => {
  const styles = useStyles()
  const tooltip = (direction: 'up' | 'down' | 'out') => {
    if (direction === 'up') return 'Expand up'
    if (direction === 'down') return 'Expand down'
    if (direction === 'out') return 'Expand up all'
  }

  if (props.direction === 'up' || props.direction === 'down' || props.direction === 'out') {
    return (
      <Tooltip title={tooltip(props.direction)} placement="left">
        <div
          css={[styles.icon, props.css]}
          onClick={(e) => props.onClick?.(e, props.direction as 'up' | 'down' | 'out')}
        >
          <LoadMoreLines
            css={[props.css]}
            width={props.width ?? 24}
            height={props.height ?? 16}
            direction={props.direction}
          />
        </div>
      </Tooltip>
    )
  }

  return (
    <div css={[styles.container, props.css]}>
      <Tooltip title={tooltip('down')} placement="left">
        <div css={styles.icon} onClick={(e) => props.onClick?.(e, 'in_down')}>
          <LoadMoreLines css={[props.css]} width={props.width ?? 24} height={props.height ?? 13} direction={'down'} />
        </div>
      </Tooltip>

      <Tooltip title={tooltip('up')} placement="left">
        <div css={styles.icon} onClick={(e) => props.onClick?.(e, 'in_up')}>
          <LoadMoreLines css={[props.css]} width={props.width ?? 24} height={props.height ?? 13} direction={'up'} />
        </div>
      </Tooltip>
    </div>
  )
}

export default LoadMoreButton
