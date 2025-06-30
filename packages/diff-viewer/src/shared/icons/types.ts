import React from 'react'

export interface HandleIconProps extends React.SVGProps<SVGSVGElement> {
  /** Icon dimension (applied to both width & height). Defaults to 24 */
  size?: number
  /** Optional additional class names */
  className?: string
}
