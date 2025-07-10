import React from 'react'

export interface CustomButton {
  /** Unique identifier for the button */
  key: string
  /** The button label text */
  label: string
  /** Tooltip text to show on hover */
  tooltipText: string
  /** Which side of the default buttons to render this custom button */
  side: 'left' | 'right'

  /** Click handler for the button */
  onClick: () => void
}

export interface ToolbarWidget {
  /** Unique identifier for the component */
  key: string
  /** The React component to render */
  component: React.ReactNode
  /** Which side of the toolbar to render this component */
  side: 'left' | 'right'
}

export interface DefaultToolbarProps {
  /** An optional content to display at the center of the toolbar */
  header?: React.ReactNode
  /** Whether the toolbar is in a loading state and should show skeleton */
  loading?: boolean
  /** Custom buttons to render on the left or right side of action buttons */
  customButtons?: CustomButton[]
  /** Whether to add the default built-in buttons (collapse, expand, mark viewed) */
  addDefaultButtons?: boolean
  /** Additional widgets to render on the left or right side of the toolbar */
  additionalWidget?: ToolbarWidget[]
}
