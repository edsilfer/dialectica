import React from 'react'
import { Interpolation } from '@emotion/react'
import { Theme } from '@emotion/react'

export interface AddButtonProps {
  className?: string
  // Kept to make typescript happy
  css?: Interpolation<Theme>

  // Callbacks ____________________________________________
  /** Optional click handler attached to the add button element */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export interface ExpandButtonProps {
  /** Whether the section is currently collapsed */
  collapsed: boolean
  /** The size of the chevron icon */
  size?: number
  /** Tooltip text to show when the section is collapsed (defaults to "Show file content") */
  tooltipTextExpand?: string
  /** Tooltip text to show when the section is expanded (defaults to "Hide file content") */
  tooltipTextCollapse?: string

  // Callbacks ____________________________________________
  /** Optional click handler attached to the chevron element */
  onClick?: (event: React.MouseEvent<SVGSVGElement>) => void
}
