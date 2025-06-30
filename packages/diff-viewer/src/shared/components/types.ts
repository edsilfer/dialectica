import React from 'react'

export interface RichTooltipProps {
  /** The content to display in the tooltip */
  tooltipText?: React.ReactNode
  /** The content to display in the toast message after an action */
  toastText?: React.ReactNode
  /** The duration in seconds to show the toast message (defaults to 2) */
  toastTimeSeconds?: number
  /** The content that will trigger the tooltip */
  children: React.ReactElement
}
