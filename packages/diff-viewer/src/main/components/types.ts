import React from 'react'

export interface ToolbarProps {
  /** The total number of files in the diff */
  totalFiles: number
  /** Whether the drawer is open */
  drawerOpen: boolean
  /** An optional title to display at the center of the toolbar */
  title?: React.ReactNode
  /** An optional subtitle to display under the title */
  subtitle?: React.ReactNode

  /** A callback to toggle the drawer */
  onToggleDrawer: (isOpen: boolean) => void
}
