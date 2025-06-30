import React from 'react'

// Similar API shape to other icons in the codebase (e.g. ChevronDown)
const HandleIcon = React.forwardRef<SVGSVGElement, { size?: number } & React.SVGProps<SVGSVGElement>>(
  ({ size = 24, ...props }, ref) => (
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
      {/* Center bar (twice stroke and slightly longer) */}
      <line x1="12" y1="2" x2="12" y2="22" strokeWidth="4" />

      {/* Horizontal shaft */}
      <line x1="0" y1="12" x2="24" y2="12" />

      {/* Left arrow */}
      <polygon points="0,12 6,16 6,8" fill="currentColor" stroke="none" />

      {/* Right arrow */}
      <polygon points="24,12 18,16 18,8" fill="currentColor" stroke="none" />
    </svg>
  ),
)

HandleIcon.displayName = 'HandleIcon'

export default HandleIcon
