import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { css, keyframes } from '@emotion/react'
import { Tooltip } from 'antd'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from '../../shared/providers/theme-context'
import { DrawerProps, DrawerState } from './types'

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
    container: (open: boolean): ReturnType<typeof css> => css`
      display: flex;
      flex-direction: row;
      height: 100%;
      width: ${open ? '100%' : iconColumnWidth};
      /* Smooth slide-in/out */
      transition: width 0.3s ease-in-out;
      gap: ${theme.spacing.sm};
    `,

    iconRail: css`
      width: ${iconColumnWidth};
      min-width: ${iconColumnWidth};
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: ${theme.spacing.sm} 0;
      gap: ${theme.spacing.sm};
      background-color: ${theme.colors.backgroundPrimary};
    `,

    iconButton: (selected: boolean): ReturnType<typeof css> => css`
      color: ${selected ? theme.colors.accent : theme.colors.textPrimary};
      font-size: 1.25rem !important;
      cursor: pointer;
      transition: color 0.2s ease-in-out;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    `,

    iconSlideInLeft: css`
      animation: ${slideInFromLeft} 0.3s ease-in-out;
    `,
    iconSlideInRight: css`
      animation: ${slideInFromRight} 0.3s ease-in-out;
    `,

    /* Right-hand side – actual content */
    contentArea: css`
      flex: 1;
      overflow: auto;
      background-color: ${theme.colors.backgroundPrimary};
    `,
  }
}

export const Drawer: React.FC<DrawerProps> = ({
  contents,
  state,
  default: defaultKey,
  isCloseable = true,
  onStateChange,
  onSelectContent,
  className,
  style,
}) => {
  const styles = useStyles()

  // Validate that the provided default key exists in contents
  const firstKey = contents[0]?.key
  const [selectedKey, setSelectedKey] = useState<string>(defaultKey ?? firstKey)

  // Keep internal selection in sync if parent changes `default` prop
  useEffect(() => {
    if (defaultKey && defaultKey !== selectedKey) {
      setSelectedKey(defaultKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultKey])

  const open = state === 'open'

  const handleToggleDrawer = () => {
    if (!isCloseable) {
      return
    }
    const newState: DrawerState = open ? 'closed' : 'open'
    onStateChange?.(newState)
  }

  const handleSelect = (key: string) => {
    setSelectedKey(key)
    onSelectContent?.(key)
    // If the drawer is closed, selecting an item should open it
    if (!open) {
      onStateChange?.('open')
    }
  }

  const selectedContent = useMemo(() => contents.find((c) => c.key === selectedKey), [contents, selectedKey])

  return (
    <div css={styles.container(open)} className={className} style={style}>
      {/* Icon rail */}
      <div css={styles.iconRail}>
        {isCloseable && (
          <Tooltip title={open ? 'Close drawer' : 'Open drawer'} placement="right">
            {open ? (
              <MenuFoldOutlined css={[styles.iconButton(false), styles.iconSlideInLeft]} onClick={handleToggleDrawer} />
            ) : (
              <MenuUnfoldOutlined
                css={[styles.iconButton(false), styles.iconSlideInRight]}
                onClick={handleToggleDrawer}
              />
            )}
          </Tooltip>
        )}

        {/* Render one icon per provided content */}
        {contents.map((content) => {
          const selected = content.key === selectedKey
          const IconElement = (
            <span css={styles.iconButton(selected)} onClick={() => handleSelect(content.key)}>
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

      {/* Content area – only rendered when the drawer is open */}
      {open && (
        <div css={styles.contentArea}>
          {selectedContent
            ? typeof selectedContent.content === 'function'
              ? selectedContent.content()
              : selectedContent.content
            : null}
        </div>
      )}
    </div>
  )
}
