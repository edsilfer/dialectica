import Icon from '@ant-design/icons'
import React from 'react'

const TICKINESS = 1
const START_X = 3
const START_Y = 6
const VERTICAL_GAP = 7
const WIDTH = 12.375

const QuotingOutlinedSvg: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* First line - 75% width */}
    <rect x={START_X} y={START_Y} width={START_X + WIDTH} height={TICKINESS} rx={TICKINESS / 2} />

    {/* Vertical line for indentation */}
    <rect x={START_X} y={START_Y + VERTICAL_GAP - 1} width={TICKINESS} height={2 * VERTICAL_GAP} rx="0.75" />

    {/* Second line - full width after vertical line */}
    <rect x={START_X + 5} y={START_Y + VERTICAL_GAP} width={START_X + WIDTH} height={TICKINESS} rx={TICKINESS / 2} />

    {/* Third line - full width after vertical line */}
    <rect
      x={START_X + 5}
      y={START_Y + VERTICAL_GAP * 2}
      width={START_X + WIDTH}
      height={TICKINESS}
      rx={TICKINESS / 2}
    />
  </svg>
)

const QuotingFilledSvg: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* First line - 75% width */}
    <rect x={START_X} y={START_Y} width={START_X + WIDTH} height={TICKINESS} rx={TICKINESS / 2} />

    {/* Vertical line for indentation */}
    <rect x={START_X} y={START_Y + VERTICAL_GAP - 1} width={TICKINESS} height={2 * VERTICAL_GAP} rx="0.75" />

    {/* Second line - full width after vertical line */}
    <rect x={START_X + 5} y={START_Y + VERTICAL_GAP} width={START_X + WIDTH} height={TICKINESS} rx={TICKINESS / 2} />

    {/* Third line - full width after vertical line */}
    <rect
      x={START_X + 5}
      y={START_Y + VERTICAL_GAP * 2}
      width={START_X + WIDTH}
      height={TICKINESS}
      rx={TICKINESS / 2}
    />
  </svg>
)

export const QuotingIcon = (props: React.ComponentProps<typeof Icon>) => (
  <Icon component={QuotingOutlinedSvg} {...props} />
)

export const QuotingFilledIcon = (props: React.ComponentProps<typeof Icon>) => (
  <Icon component={QuotingFilledSvg} {...props} />
)
