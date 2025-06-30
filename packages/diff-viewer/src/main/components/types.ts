export interface ToolbarProps {
  /** The total number of files in the diff */
  totalFiles: number
  /** Whether the drawer is open */
  drawerOpen: boolean
  /** A callback to toggle the drawer */
  onToggleDrawer: (isOpen: boolean) => void
}
