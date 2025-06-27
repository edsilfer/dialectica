import React from 'react'

const ChevronDown = React.forwardRef<
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
    <polyline points="6 9 12 15 18 9" />
  </svg>
))

ChevronDown.displayName = 'ChevronDown'

export default ChevronDown
