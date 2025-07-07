import React from 'react'
import { HandleIconProps } from './types'

const HandleIcon = React.forwardRef<SVGSVGElement, HandleIconProps>(({ size = 24, className, ...props }, ref) => {
  const mergedClassName = ['handle-icon', className].filter(Boolean).join(' ')
  return (
    <svg
      ref={ref}
      className={mergedClassName || undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ overflow: 'visible' }}
      {...props}
    >
      {/* Inline styles keep the component completely self-contained */}
      <style>{`
          .handle-icon .split { opacity: 0; transition: opacity 150ms ease; }
          .handle-icon .rest  { opacity: 1; transition: opacity 150ms ease; }

          /* Small horizontal nudge for the duplicated groups */
          .handle-icon .upper,
          .handle-icon .lower { transition: transform 150ms ease; }

          .handle-icon:hover .rest  { opacity: 0; }
          .handle-icon:hover .split { opacity: 1; }

          .handle-icon:hover .upper { transform: translateX(-4px); }
          .handle-icon:hover .lower { transform: translateX( 4px); }
        `}</style>

      {/* Original "at rest" geometry */}
      <g className="rest">
        {/* Center bar */}
        <line x1="12" y1="2" x2="12" y2="22" strokeWidth="4" />

        {/* Horizontal shaft */}
        <line x1="0" y1="12" x2="24" y2="12" strokeWidth="1" />

        {/* Left arrow */}
        <polygon points="0,12 6,16 6,8" fill="currentColor" stroke="none" />

        {/* Right arrow */}
        <polygon points="24,12 18,16 18,8" fill="currentColor" stroke="none" />
      </g>

      {/* Split state – duplicated geometry that we nudge left/right */}
      <g className="split">
        <g className="upper">
          {/* Left-shifted center bar, half-shaft & arrow */}
          <line x1="12" y1="2" x2="12" y2="22" strokeWidth="4" />
          {/* Half horizontal shaft */}
          <line x1="0" y1="12" x2="12" y2="12" strokeWidth="1" />
          <polygon points="0,12 6,16 6,8" fill="currentColor" stroke="none" />
        </g>

        <g className="lower">
          {/* Right-shifted center bar, half-shaft & arrow */}
          <line x1="12" y1="2" x2="12" y2="22" strokeWidth="4" />
          {/* Half horizontal shaft */}
          <line x1="12" y1="12" x2="24" y2="12" strokeWidth="1" />
          <polygon points="24,12 18,16 18,8" fill="currentColor" stroke="none" />
        </g>
      </g>
    </svg>
  )
})

HandleIcon.displayName = 'HandleIcon'

export default HandleIcon
