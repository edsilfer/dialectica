import React from 'react'
import { LoadMoreLinesProps } from './types'

// Geometric constants --------------------------------------------------------
const VIEWBOX = 24
const DOT_RADIUS = 0.5
const DOT_SPACING = 2
const ARROW_GAP = 3
const ARROW_LENGTH = 6
const ARROW_WIDTH = 3

type Direction = 'up' | 'down' | 'bi-directional'

/**
 * Returns the vertical position for the row of dots based on arrow direction.
 */
const getDotsY = (direction: Direction): number => {
  switch (direction) {
    case 'up':
      return VIEWBOX - (VIEWBOX * 0.35) / 2
    case 'down':
      return VIEWBOX * 0.35
    default:
      return VIEWBOX / 2 + 4 * DOT_RADIUS // bi-directional (centered with slight offset)
  }
}

/**
 * Produces the three points that form a triangular arrow head.
 */
const trianglePoints = (x: number, y: number, sign: -1 | 1): string =>
  [
    [x - ARROW_WIDTH, y - sign * ARROW_WIDTH],
    [x, y],
    [x + ARROW_WIDTH, y - sign * ARROW_WIDTH],
  ]
    .map((point) => point.join(' '))
    .join(' ')

/**
 * An icon showing a row of dots with one or two arrows (up, down, or both).
 */
const LoadMoreLines = React.forwardRef<SVGSVGElement, LoadMoreLinesProps>(
  ({ size = 24, numDots = 5, direction = 'up', ...rest }, ref) => {
    /* Dots ------------------------------------------------------ */
    const dotsY = getDotsY(direction)
    const dotX = (i: number) => 4 + i * (DOT_SPACING + DOT_RADIUS * 2)
    const midX = dotX(Math.floor(numDots / 2))

    /* Arrow renderer ------------------------------------------- */
    const renderArrow = (sign: -1 | 1) => {
      const startY = dotsY + sign * ARROW_GAP
      const endY = startY + sign * ARROW_LENGTH

      return (
        <>
          {/* Shaft */}
          <line x1={midX} y1={startY} x2={midX} y2={endY} />
          {/* Head */}
          <polygon points={trianglePoints(midX, endY, sign)} fill="currentColor" />
        </>
      )
    }

    /* Render ---------------------------------------------------- */
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        stroke="currentColor"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        {...rest}
      >
        {/* Dots */}
        {Array.from({ length: numDots }).map((_, i) => (
          <circle key={i} cx={dotX(i)} cy={dotsY} r={DOT_RADIUS} fill="currentColor" />
        ))}

        {/* Arrows */}
        {(direction === 'up' || direction === 'bi-directional') && renderArrow(-1)}
        {(direction === 'down' || direction === 'bi-directional') && renderArrow(1)}
      </svg>
    )
  },
)

LoadMoreLines.displayName = 'LoadMoreLines'
export default LoadMoreLines
