import React from 'react'
import { useDiffViewerConfig } from '@diff-viewer'

const QuotingIcon = React.forwardRef<SVGSVGElement, { size?: number } & React.SVGProps<SVGSVGElement>>(
  ({ size = 24, ...props }, ref) => {
    const { theme } = useDiffViewerConfig()
    const strokeThickness = 1

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        fill={theme.colors.textPrimary}
        viewBox="0 0 16 16"
        {...props}
      >
        {/* First line - 75% width */}
        <rect x="2" y="4" width="8.25" height={strokeThickness} rx={strokeThickness / 2} />

        {/* Vertical line for indentation */}
        <rect x="2" y="7" width={strokeThickness} height="6" rx={strokeThickness / 2} />

        {/* Second line - full width after vertical line */}
        <rect x="4.5" y="8" width="7" height={strokeThickness} rx={strokeThickness / 2} />

        {/* Third line - full width after vertical line */}
        <rect x="4.5" y="11" width="7" height={strokeThickness} rx={strokeThickness / 2} />
      </svg>
    )
  },
)

QuotingIcon.displayName = 'QuotingIcon'

export { QuotingIcon }
