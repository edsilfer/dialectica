import React from 'react'

const Directory = React.forwardRef<SVGSVGElement, { size?: number; solid?: boolean } & React.SVGProps<SVGSVGElement>>(
  ({ size = 24, solid = false, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? 'currentColor' : 'none'}
      stroke={solid ? undefined : 'currentColor'}
      strokeWidth={solid ? undefined : '2'}
      strokeLinecap={solid ? undefined : 'round'}
      strokeLinejoin={solid ? undefined : 'round'}
      {...props}
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
)

Directory.displayName = 'Directory'

export default Directory
