import React from 'react'

/* Constants */
const VIEWBOX = 24

const DOT_RADIUS = 1.5
const DOT_SPACING = 4
const DOT_CENTER_SPACING = DOT_SPACING + DOT_RADIUS * 2

const ARROW_GAP = 4
const ARROW_LENGTH = 10
const ARROW_WIDTH = 4

const CONTENT_HEIGHT = ARROW_GAP + ARROW_LENGTH + 2 * DOT_RADIUS
const VERTICAL_OFFSET = (VIEWBOX - CONTENT_HEIGHT) / 2

export interface LoadMoreLinesIconProps extends React.SVGProps<SVGSVGElement> {
  /** Icon dimension in pixels (width & height). Defaults to 24. */
  width?: number
  /** Icon dimension in pixels (width & height). Defaults to 24. */
  height?: number
  /** Amount of dots rendered in the horizontal line. Defaults to 5. */
  numDots?: number
  /** Arrow orientation */
  direction?: 'up' | 'down' | 'out'
  /** Optional additional class names */
  className?: string
}

/* Public component */
const LoadMoreLinesIcon = React.forwardRef<SVGSVGElement, LoadMoreLinesIconProps>((props, ref) => {
  const { width = 24, height = 24, numDots = 5, direction = 'up', ...rest } = props

  const midX = VIEWBOX / 2
  const dotsY = getDotsY(direction)
  const dots = Array.from({ length: numDots }, (_, i) => (
    <circle key={i} cx={getDotX(i, numDots)} cy={dotsY} r={DOT_RADIUS} fill="currentColor" />
  ))

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      {...rest}
    >
      {dots}
      {renderArrows(direction, midX, dotsY)}
    </svg>
  )
})

LoadMoreLinesIcon.displayName = 'LoadMoreLines'
export default LoadMoreLinesIcon

/**
 * Returns the vertical position for the row of dots to center the icon.
 */
function getDotsY(direction: 'up' | 'down' | 'out'): number {
  if (direction === 'up') return CONTENT_HEIGHT + VERTICAL_OFFSET - DOT_RADIUS
  if (direction === 'down') return VERTICAL_OFFSET + DOT_RADIUS
  return VIEWBOX / 2
}

/**
 * Computes horizontal position of a dot by index.
 */
function getDotX(index: number, numDots: number): number {
  const totalWidth = (numDots - 1) * DOT_CENTER_SPACING + DOT_RADIUS * 2
  const startX = (VIEWBOX - totalWidth) / 2 + DOT_RADIUS
  return startX + index * DOT_CENTER_SPACING
}

/**
 * Renders appropriate arrows depending on the direction.
 */
function renderArrows(direction: 'up' | 'down' | 'out', midX: number, dotsY: number): React.ReactNode {
  if (direction === 'up') return renderArrowOutward(midX, dotsY, -1)
  if (direction === 'down') return renderArrowOutward(midX, dotsY, 1)
  if (direction === 'out') {
    return (
      <>
        {renderArrowInward(midX, dotsY, 1)}
        {renderArrowInward(midX, dotsY, -1)}
      </>
    )
  }
  return null
}

/**
 * Renders an arrow pointing away from the dots.
 *
 * @param midX - X coordinate for arrow shaft
 * @param dotsY - Y base of the dots
 * @param sign - -1 for upward arrow, +1 for downward arrow
 */
function renderArrowOutward(midX: number, dotsY: number, sign: -1 | 1): React.ReactNode {
  const startY = dotsY + sign * ARROW_GAP
  const endY = startY + sign * ARROW_LENGTH
  return (
    <>
      <line x1={midX} y1={startY} x2={midX} y2={endY} />
      <polygon points={getTrianglePoints(midX, endY, sign)} fill="currentColor" />
    </>
  )
}

/**
 * Renders an arrow pointing toward the dots.
 *
 * @param midX - X coordinate for arrow shaft
 * @param dotsY - Y base of the dots
 * @param sign - +1 for arrow from above, -1 for arrow from below
 */
function renderArrowInward(midX: number, dotsY: number, sign: -1 | 1): React.ReactNode {
  const endY = dotsY + sign * ARROW_GAP
  const startY = endY + sign * ARROW_LENGTH + sign * ARROW_GAP
  return (
    <>
      <line x1={midX} y1={startY} x2={midX} y2={endY} />
      <polygon points={getTrianglePoints(midX, endY, -sign)} fill="currentColor" />
    </>
  )
}

/**
 * Produces a string of triangle vertex coordinates forming the arrowhead.
 *
 * @param x - tip X
 * @param y - tip Y
 * @param sign - arrow direction multiplier
 */
function getTrianglePoints(x: number, y: number, sign: number): string {
  return [
    [x - ARROW_WIDTH, y - sign * ARROW_WIDTH],
    [x, y],
    [x + ARROW_WIDTH, y - sign * ARROW_WIDTH],
  ]
    .map((point) => point.join(' '))
    .join(' ')
}
