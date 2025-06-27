import React, { useContext, useState, useRef, useEffect } from 'react'
import { Tooltip } from 'antd'
import { ThemeContext } from './providers/theme-provider'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    tooltip: {
      body: {
        backgroundColor: theme.colors.tooltipBg,
        color: theme.colors.tooltipText,
      },
    },
  }
}

interface RichTooltipProps {
  /** The text to display in the tooltip */
  tooltipText?: string
  /** The text to display in the toast message after an action */
  toastText?: string
  /** The duration in seconds to show the toast message (defaults to 2) */
  toastTimeSeconds?: number
  /** The content that will trigger the tooltip */
  children: React.ReactElement
}

const RichTooltip: React.FC<RichTooltipProps> = ({
  tooltipText,
  toastText,
  toastTimeSeconds = 2,
  children,
}) => {
  const styles = useStyles()
  const [isToastVisible, setIsToastVisible] = useState(false)
  const [tooltipTitle, setTooltipTitle] = useState(tooltipText)
  const timeoutRef = useRef<number>()

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

  // We need to clone the child element to attach the onClick handler
  // This is because the child is the trigger for the tooltip
  const childWithClickHandler = React.cloneElement(children, {
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      handleShowToast()
      // If the child has its own onClick, we should call it too
      if (children.props.onClick) {
        children.props.onClick(e)
      }
    },
  })

  if (tooltipText || toastText) {
    return (
      <Tooltip
        title={tooltipTitle}
        open={isToastVisible || undefined}
        placement={isToastVisible ? 'bottom' : 'top'}
        styles={styles.tooltip}
      >
        {childWithClickHandler}
      </Tooltip>
    )
  }

  return children
}

export default RichTooltip
