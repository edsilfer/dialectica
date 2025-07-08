import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { css, keyframes } from '@emotion/react'
import { Tooltip } from 'antd'
import React, { useContext } from 'react'
import { ThemeContext } from '../../../themes/providers/theme-context'
import { IconRailProps } from './types'

const slideInFromLeft = keyframes`
  0% {
    transform: translateX(-50%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
`

const slideInFromRight = keyframes`
  0% {
    transform: translateX(50%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
`

const useStyles = () => {
  const theme = useContext(ThemeContext)
  const iconColumnWidth = '2.25rem' // Fixed width for the icon rail

  return {
    iconRail: css`
      width: ${iconColumnWidth};
      min-width: ${iconColumnWidth};
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${theme.spacing.md};
      background-color: ${theme.colors.backgroundPrimary};
    `,

    iconButton: (selected: boolean): ReturnType<typeof css> => css`
      color: ${theme.colors.textPrimary};
      padding: ${theme.spacing.xs};
      font-size: 1.25rem !important;
      cursor: pointer;
      transition: color 0.2s ease-in-out;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;

      ${selected &&
      `
        background-color: ${theme.colors.border}50;
        border: 1px solid ${theme.colors.border};
        border-radius: ${theme.spacing.sm};
        `}
    `,

    iconSlideInLeft: css`
      animation: ${slideInFromLeft} 0.3s ease-in-out;
    `,
    iconSlideInRight: css`
      animation: ${slideInFromRight} 0.3s ease-in-out;
    `,
  }
}

export const IconRail: React.FC<IconRailProps> = (props) => {
  const styles = useStyles()
  return (
    <div css={styles.iconRail}>
      {props.isCloseable && <ToggleDrawer open={props.open} onToggleDrawer={props.onToggleDrawer} />}

      {/* Render one icon per provided content */}
      {props.contents.map((content) => {
        const selected = content.key === props.selectedKey
        const IconElement = (
          <span css={styles.iconButton(selected)} onClick={() => props.onSelect(content.key)}>
            {content.icon}
          </span>
        )
        return (
          <Tooltip key={content.key} title={content.title} placement="right">
            {IconElement}
          </Tooltip>
        )
      })}
    </div>
  )
}

const ToggleDrawer: React.FC<{ open: boolean; onToggleDrawer: () => void }> = (props) => {
  const styles = useStyles()
  return (
    <Tooltip title={props.open ? 'Close drawer' : 'Open drawer'} placement="right">
      {props.open ? (
        <MenuFoldOutlined css={[styles.iconButton(false), styles.iconSlideInLeft]} onClick={props.onToggleDrawer} />
      ) : (
        <MenuUnfoldOutlined css={[styles.iconButton(false), styles.iconSlideInRight]} onClick={props.onToggleDrawer} />
      )}
    </Tooltip>
  )
}
