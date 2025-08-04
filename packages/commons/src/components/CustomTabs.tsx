import { MoreOutlined } from '@ant-design/icons'
import { css, SerializedStyles } from '@emotion/react'
import { Dropdown, Tooltip, Typography } from 'antd'
import { ItemType } from 'antd/es/menu/interface'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { ThemeContext } from '../themes'

const { Text } = Typography
const BUTTON_WIDTH = 24
const BUTTON_PADDING = 6

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.xs};
    `,

    headerContainer: css`
      display: flex;
      flex-direction: row;
      align-items: center;
      background-color: ${theme.colors.backgroundContainer};
      gap: ${theme.spacing.sm};
      padding-right: ${theme.spacing.sm};
    `,

    headerRow: css`
      display: flex;
      align-items: center;
    `,

    tabHeader: (active: boolean) => css`
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 60px;
      min-height: 37px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &:hover {
        cursor: pointer;
        font-weight: 700;
        transition: background-color 0.2s ease;
      }

      ${active
        ? `
        background-color: ${theme.colors.backgroundPrimary};
        border-top: 1px solid ${theme.colors.border};
        border-left: 1px solid ${theme.colors.border};
        border-right: 1px solid ${theme.colors.border};
        border-bottom: 1px solid ${theme.colors.backgroundPrimary};
        border-radius: ${theme.spacing.xs} ${theme.spacing.xs} 0 0;
        margin-top: -2px;
        margin-left: -1px;
        position: relative;
        z-index: 1;
      `
        : ''}
    `,

    buttonsContainer: css`
      display: flex;
      align-items: center;
      justify-content: flex-end; /* keep icons right‑aligned on their line */
      gap: ${BUTTON_PADDING}px;
      margin-left: auto; /* push container to the right when sharing the first line */
      min-width: 0; /* allow shrinking */
    `,

    button: css`
      width: ${BUTTON_WIDTH}px;
      padding: ${theme.spacing.xs};
      color: ${theme.colors.textPrimary};

      &:hover {
        cursor: pointer;
        background-color: ${theme.colors.accent}75 !important;
        border-radius: ${theme.spacing.xxs};
      }
    `,

    divider: css`
      height: 16px;
      width: 1px;
      background-color: ${theme.colors.border};
    `,

    tabContent: css`
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: ${theme.spacing.sm};
      background-color: ${theme.colors.backgroundPrimary};
      border-top: 1px solid ${theme.colors.border};
      margin-top: -2px;
      border-bottom-left-radius: ${theme.spacing.xs};
      border-bottom-right-radius: ${theme.spacing.xs};
    `,

    footerContainer: css`
      margin-top: ${theme.spacing.sm};
      display: flex;
      gap: ${theme.spacing.sm};
    `,
  }
}

export interface TabItem {
  /** Unique key for the tab */
  key: string
  /** Display title for the tab */
  title: string
  /** Optional helper text or tooltip for the tab */
  helper?: string
  /** The content to render when this tab is active */
  content: React.ReactNode
  /** Optional footer to display for the tab */
  footer?: React.ReactNode
}

export interface TabActionButton {
  /** Unique key for the action */
  key: string
  /** The icon to display */
  icon: React.ReactNode
  /** Optional tooltip text */
  tooltip?: string
  /** Whether the button should be disabled */
  disabled?: boolean
  /** The group number for the action button */
  group?: number

  /** Callback when the action is clicked */
  onClick: () => void
}

export interface CustomTabsProps {
  /** Array of tab items */
  tabs: TabItem[]
  /** Array of action buttons to display on the right side of the header */
  actions?: TabActionButton[]
  /** Currently active tab key */
  activeTab: string
  /** Optional CSS styles */
  css?: SerializedStyles
  /** Optional CSS class name */
  className?: string

  /** Callback when a tab is clicked */
  onTabChange: (tabKey: string) => void
}

/**
 * A custom tabs component with support for action buttons in the header.
 *
 * @param tabs - Array of tab items to display
 * @param actions - Optional array of action buttons to display on the right side
 * @param activeTab - Currently active tab key
 * @param onTabChange - Callback when a tab is clicked
 * @param className - Optional CSS class name
 * @returns A React component that displays tabs with custom header actions
 */
export const CustomTabs: React.FC<CustomTabsProps> = ({
  tabs,
  actions = [],
  activeTab,
  onTabChange,
  css: customCss,
  className,
}) => {
  const styles = useStyles()

  const containerRef = useRef<HTMLDivElement>(null)
  const tabHeaderRef = useRef<HTMLDivElement>(null)

  const [visibleButtons, setVisibleButtons] = useState<TabActionButton[]>([])
  const [hiddenButtons, setHiddenButtons] = useState<ItemType[]>([])

  useEffect(() => {
    const container = containerRef.current
    const tabHeader = tabHeaderRef.current

    if (!container || !tabHeader) return

    let containerWidth = 0
    let tabHeaderWidth = 0

    const handleResize = () => {
      const buttonWidth = BUTTON_WIDTH + BUTTON_PADDING
      const availableWidth = containerWidth - tabHeaderWidth - buttonWidth
      const visibleRange = Math.max(0, Math.floor(availableWidth / buttonWidth) - 1)
      const sortedButtons = actions.sort((a, b) => (a.group ?? 0) - (b.group ?? 0))

      let visibleButtons = []
      let hiddenButtons = []

      // If we don't have container dimensions yet, show all buttons
      if (!containerWidth || !tabHeaderWidth) {
        visibleButtons = sortedButtons
      } else {
        for (let i = 0; i < sortedButtons.length; i++) {
          const button = sortedButtons[i]
          if (visibleButtons.length < visibleRange) {
            visibleButtons.push(button)
          } else {
            hiddenButtons.push(button)
          }
        }
      }

      setVisibleButtons(visibleButtons)
      setHiddenButtons(
        hiddenButtons.map((button) => ({
          key: button.key,
          label: button.tooltip,
          onClick: button.onClick,
        })),
      )
    }

    const containerObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        containerWidth = entry.contentRect.width
        handleResize()
      }
    })

    const tabHeaderObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        tabHeaderWidth = entry.contentRect.width
        handleResize()
      }
    })

    containerObserver.observe(container)
    tabHeaderObserver.observe(tabHeader)

    // Initial setup of buttons
    handleResize()

    return () => {
      containerObserver.disconnect()
      tabHeaderObserver.disconnect()
    }
  }, [actions])

  const handleTabClick = (tabKey: string) => {
    onTabChange(tabKey)
  }

  const activeTabItem = tabs.find((tab) => tab.key === activeTab)

  return (
    <div ref={containerRef} css={[styles.container, customCss]} className={className}>
      {/* Custom Tab Header */}
      <div css={styles.headerContainer}>
        <div css={styles.headerRow} ref={tabHeaderRef}>
          {tabs.map((tab) => (
            <div
              key={tab.key}
              data-testid={`tab-header-${tab.title}`}
              css={styles.tabHeader(activeTab === tab.key)}
              onClick={() => handleTabClick(tab.key)}
            >
              <Text>{tab.title}</Text>
            </div>
          ))}
        </div>

        {/* Visible Action Buttons */}
        {visibleButtons.length > 0 && (
          <div css={styles.buttonsContainer}>
            {visibleButtons.map((action, index, sortedActions) => {
              const prevAction = index > 0 ? sortedActions[index - 1] : undefined
              const showDivider = prevAction && (prevAction.group ?? 0) !== (action.group ?? 0)

              return (
                <React.Fragment key={action.key}>
                  {showDivider && <div css={styles.divider} />}
                  <Tooltip key={action.key} title={action.tooltip}>
                    <div css={styles.button} onClick={action.onClick} data-testid={`tab-action-${action.key}`}>
                      {action.icon}
                    </div>
                  </Tooltip>
                </React.Fragment>
              )
            })}
          </div>
        )}

        {/* Hidden Action Buttons */}
        {hiddenButtons.length > 0 && (
          <Dropdown menu={{ items: hiddenButtons }} trigger={['click']} placement="bottomRight">
            <MoreOutlined css={styles.button} data-testid="comment-menu-button" rotate={90} />
          </Dropdown>
        )}
      </div>

      {/* Tab Content */}
      <div css={styles.tabContent}>
        {activeTabItem?.content}
        {activeTabItem?.footer && <div css={styles.footerContainer}>{activeTabItem.footer}</div>}
      </div>
    </div>
  )
}
