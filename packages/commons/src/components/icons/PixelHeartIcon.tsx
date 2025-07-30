import React from 'react'

export const PixelHeartIcon = React.forwardRef<
  SVGSVGElement,
  { size?: number; style?: React.CSSProperties } & React.SVGProps<SVGSVGElement>
>(function PixelHeart({ size = 24, style, ...props }, ref) {
  const mergedStyle: React.CSSProperties = {
    verticalAlign: 'middle',
    margin: '0 4px',
    ...(style as React.CSSProperties),
  }

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 8 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      {...props}
      style={mergedStyle}
    >
      <rect x="1" y="0" width="1" height="1" fill="currentColor" />
      <rect x="2" y="0" width="1" height="1" fill="currentColor" />
      <rect x="5" y="0" width="1" height="1" fill="currentColor" />
      <rect x="6" y="0" width="1" height="1" fill="currentColor" />

      {/** Row 1 */}
      <rect x="0" y="1" width="1" height="1" fill="currentColor" />
      <rect x="1" y="1" width="1" height="1" fill="currentColor" />
      <rect x="2" y="1" width="1" height="1" fill="currentColor" />
      <rect x="3" y="1" width="1" height="1" fill="currentColor" />
      <rect x="4" y="1" width="1" height="1" fill="currentColor" />
      <rect x="5" y="1" width="1" height="1" fill="currentColor" />
      <rect x="6" y="1" width="1" height="1" fill="currentColor" />
      <rect x="7" y="1" width="1" height="1" fill="currentColor" />

      {/** Row 2 */}
      <rect x="0" y="2" width="1" height="1" fill="currentColor" />
      <rect x="1" y="2" width="1" height="1" fill="currentColor" />
      <rect x="2" y="2" width="1" height="1" fill="currentColor" />
      <rect x="3" y="2" width="1" height="1" fill="currentColor" />
      <rect x="4" y="2" width="1" height="1" fill="currentColor" />
      <rect x="5" y="2" width="1" height="1" fill="currentColor" />
      <rect x="6" y="2" width="1" height="1" fill="currentColor" />
      <rect x="7" y="2" width="1" height="1" fill="currentColor" />

      {/** Row 3 */}
      <rect x="0" y="3" width="1" height="1" fill="currentColor" />
      <rect x="1" y="3" width="1" height="1" fill="currentColor" />
      <rect x="2" y="3" width="1" height="1" fill="currentColor" />
      <rect x="3" y="3" width="1" height="1" fill="currentColor" />
      <rect x="4" y="3" width="1" height="1" fill="currentColor" />
      <rect x="5" y="3" width="1" height="1" fill="currentColor" />
      <rect x="6" y="3" width="1" height="1" fill="currentColor" />
      <rect x="7" y="3" width="1" height="1" fill="currentColor" />

      {/** Row 4 */}
      <rect x="1" y="4" width="1" height="1" fill="currentColor" />
      <rect x="2" y="4" width="1" height="1" fill="currentColor" />
      <rect x="3" y="4" width="1" height="1" fill="currentColor" />
      <rect x="4" y="4" width="1" height="1" fill="currentColor" />
      <rect x="5" y="4" width="1" height="1" fill="currentColor" />
      <rect x="6" y="4" width="1" height="1" fill="currentColor" />

      {/** Row 5 */}
      <rect x="2" y="5" width="1" height="1" fill="currentColor" />
      <rect x="3" y="5" width="1" height="1" fill="currentColor" />
      <rect x="4" y="5" width="1" height="1" fill="currentColor" />
      <rect x="5" y="5" width="1" height="1" fill="currentColor" />

      {/** Row 6 */}
      <rect x="3" y="6" width="1" height="1" fill="currentColor" />
      <rect x="4" y="6" width="1" height="1" fill="currentColor" />
    </svg>
  )
})
