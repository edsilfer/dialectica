import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { ThemeContext } from '@commons'
import { css, keyframes } from '@emotion/react'
import { Tooltip } from 'antd'
import React, { useContext } from 'react'
import { DrawerContent, DrawerProps } from './Drawer'

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
    container: css`
      width: ${iconColumnWidth};
      min-width: ${iconColumnWidth};
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${theme.spacing.md};
      background-color: ${theme.colors.backgroundPrimary};

      @media (max-width: 768px) {
        flex-direction: row;
        height: auto;
      }
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

export interface IconRailProps {
  /** Whether the drawer can be closed */
  isCloseable: boolean
  /** Whether the drawer is open */
  open: boolean
  /** The contents of the drawer */
  contents: DrawerProps['contents']
  /** The key of the selected content */
  selectedKey: string
  /** Callback to toggle the drawer */
  onToggleDrawer: () => void
  /** Callback to select a content */
  onSelect: (key: string) => void
}

export const IconRail: React.FC<IconRailProps> = (props) => {
  const styles = useStyles()
  return (
    <div css={styles.container}>
      {props.isCloseable && <ToggleDrawer open={props.open} onToggleDrawer={props.onToggleDrawer} />}

      {/* Render one icon per provided content */}
      {props.contents.map((content) => {
        const selected = content.key === props.selectedKey
        return (
          <IconButton
            key={content.key}
            content={content}
            selected={selected}
            onClick={() => props.onSelect(content.key)}
          />
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

function IconButton(props: { content: DrawerContent; selected: boolean; onClick: () => void }) {
  const styles = useStyles()
  return (
    <Tooltip key={props.content.key} title={props.content.title} placement="right">
      <span css={styles.iconButton(props.selected)} onClick={props.onClick}>
        {props.content.icon}
      </span>
    </Tooltip>
  )
}
