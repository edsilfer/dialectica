import React from 'react'

export interface ToolbarProps {
  /** The total number of files in the diff */
  totalFiles: number
  /** An optional title to display at the center of the toolbar */
  title?: React.ReactNode
  /** An optional subtitle to display under the title */
  subtitle?: React.ReactNode
  /** Whether the toolbar is in a loading state and should show skeleton */
  loading?: boolean
}
