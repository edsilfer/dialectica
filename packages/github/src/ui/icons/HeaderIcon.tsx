import React from 'react'
import { useDiffViewerConfig } from '@diff-viewer'

const HeaderIcon = React.forwardRef<SVGSVGElement, { size?: number } & React.SVGProps<SVGSVGElement>>(
  ({ size = 18, ...props }, ref) => {
    const { theme } = useDiffViewerConfig()
    const thickness = 1.5

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
        {/* Left vertical bar of H */}
        <rect x="3" y="3" width={thickness} height="11" rx={thickness / 6} />

        {/* Right vertical bar of H */}
        <rect x="11" y="3" width={thickness} height="11" rx={thickness / 6} />

        {/* Horizontal bar connecting the two verticals */}
        <rect x="3" y="8" width="8" height={thickness * 0.67} rx={thickness / 6} />
      </svg>
    )
  },
)

HeaderIcon.displayName = 'HeaderIcon'

export { HeaderIcon }
