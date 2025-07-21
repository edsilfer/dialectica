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
