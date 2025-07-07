import React from 'react'

/** Drawer open / closed state */
export type DrawerState = 'open' | 'closed'

/**
 * A single piece of content that the drawer can render.
 */
export interface DrawerContent {
  /** Unique identifier for this content */
  key: string
  /** Small icon that represents the content in the drawer menu */
  icon: React.ReactNode
  /** Short, human-readable name (displayed in the tooltip) */
  title: string
  /** Optional longer description – currently unused but available for future UX improvements */
  description?: string
  /** React node (or a function returning one) that will be rendered when this entry is selected */
  content: React.ReactNode | (() => React.ReactNode)
}

export interface DrawerProps {
  /** All contents that the drawer can switch between */
  contents: DrawerContent[]
  /** Controlled state: whether the drawer is open or closed */
  state: DrawerState
  /** The key of the content currently being displayed (default selection) */
  default: DrawerContent['key']
  /** Prevent the user from closing the drawer. Defaults to true (drawer can be closed). */
  isCloseable?: boolean
  /** Show loading skeleton instead of content */
  loading?: boolean
  /** Optional className applied to the root element */
  className?: string
  /** Optional style prop applied to the root element */
  style?: React.CSSProperties

  /** Callback fired when the drawer state changes (open <-> closed) */
  onStateChange?: (state: DrawerState) => void
  /** Callback fired when the selected content changes */
  onSelectContent?: (key: DrawerContent['key']) => void
}

export interface IconRailProps {
  /** Whether the drawer can be closed */
  isCloseable: boolean
  /** Whether the drawer is open */
  open: boolean
  /** The contents of the drawer */
  contents: DrawerProps['contents']
  /** The key of the selected content */
  selectedKey: string
  /** Callback to toggle the drawer */
  onToggleDrawer: () => void
  /** Callback to select a content */
  onSelect: (key: string) => void
}
