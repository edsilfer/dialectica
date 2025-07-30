import React from 'react'

export const UnwrappedLineIcon = React.forwardRef<SVGSVGElement, { size?: number } & React.SVGProps<SVGSVGElement>>(
  function UnwrappedLine({ size = 24, ...props }, ref) {
    return (
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
        data-testid="unwrap-lines-icon"
      >
        {/* Top unbroken line */}
        <line x1="4" y1="5" x2="20" y2="5" />

        {/* Second unbroken line */}
        <line x1="4" y1="10" x2="20" y2="10" />

        {/* Third unbroken line */}
        <line x1="4" y1="15" x2="20" y2="15" />

        {/* Bottom short line */}
        <line x1="4" y1="20" x2="20" y2="20" />
      </svg>
    )
  },
)
