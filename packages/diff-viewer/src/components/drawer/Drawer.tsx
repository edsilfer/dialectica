import { ThemeContext } from '@dialectica-org/commons'
import { css } from '@emotion/react'
import { Skeleton } from 'antd'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { IconRail } from './IconRail'

const useStyles = () => {
  const theme = useContext(ThemeContext)
  const ICON_COLUMN_WIDTH = '2.25rem'

  return {
    container: (open: boolean): ReturnType<typeof css> => css`
      display: flex;
      flex-direction: row;
      height: 100%;
      width: ${open ? '100%' : ICON_COLUMN_WIDTH};
      /* Smooth slide-in/out */
      transition: width 0.3s ease-in-out;
      gap: ${theme.spacing.sm};
      overflow: hidden;

      @media (max-width: 768px) {
        width: 100%;
        flex-direction: column !important;
      }
    `,

    /* Right-hand side – actual content */
    contentArea: css`
      flex: 1;
      background-color: ${theme.colors.backgroundPrimary};
      overflow: hidden;
    `,
  }
}

/** Drawer open / closed state */
export type DrawerState = 'open' | 'closed'

/**
 * A single piece of content that the drawer can render.
 */
export interface DrawerContent {
  /** Unique identifier for this content */
  key: string
  /** Small icon that represents the content in the drawer menu */
  icon: React.ReactNode
  /** Short, human-readable name (displayed in the tooltip) */
  title: string
  /** Optional longer description – currently unused but available for future UX improvements */
  description?: string
  /** React node (or a function returning one) that will be rendered when this entry is selected */
  content: React.ReactNode | (() => React.ReactNode)
}

export interface DrawerProps {
  /** All contents that the drawer can switch between */
  contents: DrawerContent[]
  /** Controlled state: whether the drawer is open or closed */
  state: DrawerState
  /** The key of the content currently being displayed (default selection) */
  default: DrawerContent['key']
  /** Prevent the user from closing the drawer. Defaults to true (drawer can be closed). */
  isCloseable?: boolean
  /** Show loading skeleton instead of content */
  loading?: boolean
  /** Optional className applied to the root element */
  className?: string
  /** Optional style prop applied to the root element */
  style?: React.CSSProperties

  /** Callback fired when the drawer state changes (open <-> closed) */
  onStateChange?: (state: DrawerState) => void
  /** Callback fired when the selected content changes */
  onSelectContent?: (key: DrawerContent['key']) => void
}

export const Drawer: React.FC<DrawerProps> = (props) => {
  const styles = useStyles()

  const firstKey = props.contents[0]?.key
  const [selectedKey, setSelectedKey] = useState<string>(props.default ?? firstKey)

  useEffect(() => {
    if (props.default && props.default !== selectedKey) {
      setSelectedKey(props.default)
    }
  }, [props.default, selectedKey])

  const open = props.state === 'open'

  const handleToggleDrawer = () => {
    if (!(props.isCloseable ?? true)) {
      return
    }
    const newState: DrawerState = open ? 'closed' : 'open'
    props.onStateChange?.(newState)
  }

  const handleSelect = (key: string) => {
    setSelectedKey(key)
    props.onSelectContent?.(key)
    if (!open) {
      props.onStateChange?.('open')
    }
  }

  const selectedContent = useMemo(
    () => props.contents.find((c) => c.key === selectedKey),
    [props.contents, selectedKey],
  )

  if (props.loading ?? false) {
    return <Skeleton active paragraph={{ rows: 4 }} style={{ padding: '16px' }} />
  }

  return (
    <div data-testid="drawer-container" css={styles.container(open)} className={props.className} style={props.style}>
      {/* Icon rail */}
      <IconRail
        isCloseable={props.isCloseable ?? true}
        open={open}
        contents={props.contents}
        selectedKey={selectedKey}
        onToggleDrawer={handleToggleDrawer}
        onSelect={handleSelect}
      />

      {/* Content area */}
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
