import Icon from '@ant-design/icons'
import React from 'react'

const thickness = 95
const cornerRadius = thickness / 6

const barHeight = 750
const barTop = 150

const HeaderOutlinedSvg: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="64 64 896 896" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    {/* Left vertical bar of H */}
    <rect x="280" y={barTop} width={thickness} height={barHeight} rx={cornerRadius} />

    {/* Right vertical bar of H */}
    <rect x="700" y={barTop} width={thickness} height={barHeight} rx={cornerRadius} />

    {/* Horizontal bar connecting the two verticals */}
    <rect
      x="344"
      y={barTop + barHeight / 2 - (thickness * 0.67) / 2}
      width="400"
      height={thickness * 0.67}
      rx={cornerRadius}
    />
  </svg>
)

export const HeaderIcon = (props: React.ComponentProps<typeof Icon>) => (
  <Icon component={HeaderOutlinedSvg} {...props} />
)
