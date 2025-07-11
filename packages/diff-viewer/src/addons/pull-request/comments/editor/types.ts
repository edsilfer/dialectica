import React from 'react'

export interface TabItem {
  /** Unique key for the tab */
  key: string
  /** Display title for the tab */
  title: string
  /** Optional helper text or tooltip for the tab */
  helper?: string
  /** The content to render when this tab is active */
  content: React.ReactNode
}

export interface TabActionButton {
  /** Unique key for the action */
  key: string
  /** The icon to display */
  icon: React.ReactNode
  /** Optional tooltip text */
  tooltip?: string
  /** Callback when the action is clicked */
  onClick: () => void
  /** Whether the button should be disabled */
  disabled?: boolean
}

export interface CustomTabsProps {
  /** Array of tab items */
  tabs: TabItem[]
  /** Array of action buttons to display on the right side of the header */
  actions?: TabActionButton[]
  /** Currently active tab key */
  activeTab: string
  /** Callback when a tab is clicked */
  onTabChange: (tabKey: string) => void
  /** Optional CSS class name */
  className?: string
}
