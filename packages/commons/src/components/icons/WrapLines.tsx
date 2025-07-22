import React from 'react'

const WrappedLines = React.forwardRef<SVGSVGElement, { size?: number } & React.SVGProps<SVGSVGElement>>(
  ({ size = 24, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      data-testid="wrap-lines-icon"
    >
      {/* Top unbroken line */}
      <line x1="4" y1="5" x2="20" y2="5" />

      {/* Second unbroken line */}
      <line x1="4" y1="10" x2="20" y2="10" />

      {/* Middle line that wraps: horizontal → small top-right curve → down → small bottom-right curve → left */}
      <path d="M4 15 H18 q2 0 2 2 v1 q0 2 -2 2 H10" />

      {/* Filled triangular arrow head */}
      <polygon points="10 17 2 20 10 23" fill="currentColor" stroke="none" />

      {/* Bottom short line */}
      <line x1="4" y1="20" x2="10" y2="20" />
    </svg>
  ),
)

WrappedLines.displayName = 'WrapLines'

export default WrappedLines
