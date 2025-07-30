import { Tooltip } from 'antd'
import React, { useEffect, useRef, useState } from 'react'

interface RichTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The content to display in the tooltip */
  tooltipText?: React.ReactNode
  /** The content to display in the toast message after an action */
  toastText?: React.ReactNode
  /** The duration in seconds to show the toast message (defaults to 2) */
  toastTimeSeconds?: number
  /** The content that will trigger the tooltip */
  children: React.ReactElement
}

export function RichTooltip(props: RichTooltipProps) {
  const { tooltipText, toastText, toastTimeSeconds = 2, children, ...rest } = props
  const [isToastVisible, setIsToastVisible] = useState(false)
  const [tooltipTitle, setTooltipTitle] = useState(tooltipText)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    // When the component unmounts, clear the timeout
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Update tooltipTitle when tooltipText prop changes
    setTooltipTitle(tooltipText)
  }, [tooltipText])

  const handleShowToast = () => {
    if (toastText) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setIsToastVisible(true)
      setTooltipTitle(toastText)

      timeoutRef.current = window.setTimeout(() => {
        setIsToastVisible(false)
        setTooltipTitle(tooltipText)
      }, toastTimeSeconds * 1000)
    }
  }

  /*
   * We need to clone the child element to attach the onClick handler.
   * Cast `children` so that the TypeScript compiler recognises it as a
   * concrete ReactElement whose props we can safely read & extend.
   */
  // Explicitly type the child element so that we can safely access its props
  const childElement = children as React.ReactElement<
    {
      onClick?: (event: React.MouseEvent<HTMLElement>) => void
    },
    string | React.JSXElementConstructor<unknown>
  >
  const childWithClickHandler = React.cloneElement(childElement, {
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      handleShowToast()
      // If the original element provided its own onClick, preserve it.
      const originalOnClick = childElement.props?.onClick

      if (originalOnClick) {
        originalOnClick(e)
      }
    },
  })

  if (tooltipText || toastText) {
    return (
      <div data-tooltip={tooltipText} {...rest}>
        <Tooltip title={tooltipTitle} open={isToastVisible || undefined} placement={isToastVisible ? 'bottom' : 'top'}>
          {childWithClickHandler}
        </Tooltip>
      </div>
    )
  }

  return (
    <div data-tooltip={tooltipText} {...rest}>
      {React.cloneElement(children)}
    </div>
  )
}
