import React from 'react'

// Similar API shape to other icons in the codebase (e.g. ChevronDown)
const HandleIcon = React.forwardRef<
  SVGSVGElement,
  { size?: number } & React.SVGProps<SVGSVGElement>
>(({ size = 24, ...props }, ref) => (
  <svg
    ref={ref}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Vertical bars */}
    <line x1="9" y1="4" x2="9" y2="20" />
    <line x1="15" y1="4" x2="15" y2="20" />

    {/* Arrows pointing outward from bars */}
    {/* Left arrow: move outward */}
    <polyline points="8 12 4 8" />
    <polyline points="8 12 4 16" />
    {/* Right arrow */}
    <polyline points="16 12 20 8" />
    <polyline points="16 12 20 16" />
  </svg>
))

HandleIcon.displayName = 'HandleIcon'

export default HandleIcon
