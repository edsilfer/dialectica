import { css } from '@emotion/react'
import { Tooltip } from 'antd'
import React from 'react'
import { useDiffViewerConfig } from '../../../../components/diff-viewer/providers/diff-viewer-context'
import { CustomTabsProps } from './types'

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    headerContainer: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${theme.spacing.sm};
      background-color: ${theme.colors.backgroundPrimary};
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.xs} ${theme.spacing.xs} 0 0;
      border-bottom: none;
    `,

    tabButtons: css`
      display: flex;
      gap: ${theme.spacing.xs};
      align-items: center;
    `,

    tabButton: css`
      padding: ${theme.spacing.xs} ${theme.spacing.sm};
      background-color: transparent;
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.xs};
      color: ${theme.colors.textPrimaryPlaceholder};
      cursor: pointer;
      font-size: ${theme.typography.regularFontSizeSM}px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 28px;

      &:hover {
        background-color: ${theme.colors.hoverContainer};
        color: ${theme.colors.textPrimary};
      }

      &.active {
        background-color: ${theme.colors.accent};
        color: white;
        border-color: ${theme.colors.accent};
      }

      .anticon {
        font-size: 14px;
      }
    `,

    actionButton: css`
      padding: ${theme.spacing.xs} ${theme.spacing.sm};
      background-color: transparent;
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.xs};
      color: ${theme.colors.textPrimaryPlaceholder};
      cursor: pointer;
      font-size: ${theme.typography.regularFontSizeSM}px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 28px;

      &:hover {
        background-color: ${theme.colors.hoverContainer};
        color: ${theme.colors.textPrimary};
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .anticon {
        font-size: 14px;
      }
    `,

    tabContent: css`
      padding: ${theme.spacing.sm};
      background-color: ${theme.colors.backgroundPrimary};
      border: 1px solid ${theme.colors.border};
      border-top: none;
      border-radius: 0 0 ${theme.spacing.xs} ${theme.spacing.xs};
    `,
  }
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
    <div className={className}>
      {/* Custom Tab Header */}
      <div css={styles.headerContainer}>
        <div css={styles.tabButtons}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              css={[styles.tabButton, activeTab === tab.key && css`&.active`]}
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => handleTabClick(tab.key)}
              data-testid={`tab-${tab.key}`}
              title={tab.helper}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* Header Action Buttons */}
        {actions.length > 0 && (
          <div css={styles.tabButtons}>
            {actions.map((action) => (
              <Tooltip key={action.key} title={action.tooltip}>
                <button
                  css={styles.actionButton}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  data-testid={`action-${action.key}`}
                  title={action.tooltip}
                >
                  {action.icon}
                </button>
              </Tooltip>
            ))}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div css={styles.tabContent}>{activeTabItem?.content}</div>
    </div>
  )
}
