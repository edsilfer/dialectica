import React from 'react'

export interface LoadMoreLinesProps extends React.SVGProps<SVGSVGElement> {
  /** Icon dimension in pixels (width & height). Defaults to 24. */
  size?: number
  /** Amount of dots rendered in the horizontal line. Defaults to 5. */
  numDots?: number
  /** Arrow orientation */
  direction?: 'up' | 'down' | 'bi-directional'
}

export interface HandleIconProps extends React.SVGProps<SVGSVGElement> {
  /** Icon dimension (applied to both width & height). Defaults to 24 */
  size?: number
  /** Optional additional class names */
  className?: string
}
