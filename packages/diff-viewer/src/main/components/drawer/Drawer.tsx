import { css } from '@emotion/react'
import { Skeleton } from 'antd'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from '../../../shared/providers/theme-context'
import { IconRail } from './IconRail'
import { DrawerProps, DrawerState } from './types'

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
    `,

    /* Right-hand side – actual content */
    contentArea: css`
      flex: 1;
      overflow: auto;
      background-color: ${theme.colors.backgroundPrimary};
    `,
  }
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
    <div css={styles.container(open)} className={props.className} style={props.style}>
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
