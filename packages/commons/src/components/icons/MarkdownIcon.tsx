import React, { useContext } from 'react'
import { ThemeContext } from '../../themes/providers/theme-context'

export const MarkdownIcon = React.forwardRef<
  SVGSVGElement,
  { size?: number; inverted: boolean } & React.SVGProps<SVGSVGElement>
>(function MarkdownIcon({ size = 16, inverted = false, ...props }, ref) {
  const theme = useContext(ThemeContext)
  const color = inverted ? theme.colors.textPrimary : theme.colors.textContainerPlaceholder

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 15 15" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill={color}
        d="M0 3.5C0 2.67157 0.671573 2 1.5 2H13.5C14.3284 2 15 2.67157 15 3.5V11.5C15 12.3284 14.3284 13 13.5 13H1.5C0.671574 13 0 12.3284 0 11.5V3.5ZM10 5V8.29289L8.85359 7.14648L8.14648 7.85359L10.1465 9.85359C10.3417 10.0489 10.6583 10.0489 10.8536 9.85359L12.8536 7.85359L12.1465 7.14648L11 8.29297V5H10ZM2.85355 5.14646C2.71055 5.00346 2.4955 4.96068 2.30866 5.03807C2.12182 5.11547 2 5.29778 2 5.50001V10H3V6.70712L4.5 8.20712L6 6.70712V10H7V5.50001C7 5.29778 6.87818 5.11547 6.69134 5.03807C6.5045 4.96068 6.28945 5.00346 6.14645 5.14646L4.5 6.79291L2.85355 5.14646Z"
      />
    </svg>
  )
})
