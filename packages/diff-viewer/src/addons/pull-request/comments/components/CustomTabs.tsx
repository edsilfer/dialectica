import { css } from '@emotion/react'
import { Tooltip, Typography } from 'antd'
import React from 'react'
import { useDiffViewerConfig } from '../../../../components/diff-viewer/providers/diff-viewer-context'
import { TabActionButton, TabItem } from './types'

const { Text } = Typography

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    container: css`
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.xs};
    `,

    headerContainer: css`
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      background-color: ${theme.colors.backgroundContainer};
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

      &:hover {
        cursor: pointer;
        background-color: ${theme.colors.accent};
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
      gap: ${theme.spacing.sm};
      padding-right: ${theme.spacing.sm};
    `,

    button: css`
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

export interface CustomTabsProps {
  /** Array of tab items */
  tabs: TabItem[]
  /** Array of action buttons to display on the right side of the header */
  actions?: TabActionButton[]
  /** Currently active tab key */
  activeTab: string
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
export const CustomTabs: React.FC<CustomTabsProps> = ({ tabs, actions = [], activeTab, onTabChange, className }) => {
  const styles = useStyles()

  const handleTabClick = (tabKey: string) => {
    onTabChange(tabKey)
  }

  const activeTabItem = tabs.find((tab) => tab.key === activeTab)

  return (
    <div css={styles.container} className={className}>
      {/* Custom Tab Header */}
      <div css={styles.headerContainer}>
        <div css={styles.headerRow}>
          {tabs.map((tab) => (
            <div key={tab.key} css={styles.tabHeader(activeTab === tab.key)} onClick={() => handleTabClick(tab.key)}>
              <Text>{tab.title}</Text>
            </div>
          ))}
        </div>

        {/* Header Action Buttons */}
        {actions.length > 0 && (
          <div css={styles.buttonsContainer}>
            {actions
              .slice()
              .sort((a, b) => (a.group ?? 0) - (b.group ?? 0))
              .map((action, index, sortedActions) => {
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
      </div>

      {/* Tab Content */}
      <div css={styles.tabContent}>
        {activeTabItem?.content}
        {activeTabItem?.footer && <div css={styles.footerContainer}>{activeTabItem.footer}</div>}
      </div>
    </div>
  )
}
