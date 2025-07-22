import { Button, Space, Tooltip } from 'antd'
import React from 'react'

export interface CustomButton {
  /** Unique identifier for the button */
  key: string
  /** The button label text */
  label: string
  /** Tooltip text to show on hover */
  tooltipText: string
  /** Which side of the default buttons to render this custom button */
  side: 'left' | 'right'

  /** Click handler for the button */
  onClick: () => void
}

export const ActionButtons: React.FC<{ buttons?: CustomButton[] }> = (props) => {
  const renderCustomButtons = (buttons: CustomButton[]) => {
    return buttons.map((button) => (
      <Tooltip key={button.key} title={button.tooltipText}>
        <Button size="small" onClick={button.onClick}>
          {button.label}
        </Button>
      </Tooltip>
    ))
  }

  const leftButtons = props.buttons?.filter((button) => button.side === 'left') ?? []
  const rightButtons = props.buttons?.filter((button) => button.side === 'right') ?? []

  return (
    <Space.Compact>
      {/* Left custom buttons */}
      {renderCustomButtons(leftButtons)}

      {/* Right custom buttons */}
      {renderCustomButtons(rightButtons)}
    </Space.Compact>
  )
}
