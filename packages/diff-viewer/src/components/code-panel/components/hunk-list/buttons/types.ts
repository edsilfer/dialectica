import { SerializedStyles } from '@emotion/react'
import React from 'react'
import { HunkDirection } from '../types'

export interface WrapLinesButtonProps {
  /** Whether the lines are currently wrapped */
  isWrapped: boolean
  /** The size of the copy icon */
  size?: number
  /** The tooltip to display when hovering over the copy icon */
  tooltip?: string
  /** The text to display when the copy is successful */
  toastText?: string
  /** The function to call when the copy icon is clicked */
  onClick: (event: React.MouseEvent<SVGSVGElement>) => void
}

export interface CopyButtonProps {
  /** The size of the copy icon */
  size?: number
  /** The tooltip to display when hovering over the copy icon */
  tooltip?: string
  /** The text to display when the copy is successful */
  toastText?: string
  /** The function to call when the copy icon is clicked */
  onClick: (event: React.MouseEvent<SVGSVGElement>) => void
}

export interface LoadMoreButtonProps {
  /** The direction of the load more arrows */
  direction: HunkDirection
  /** Optional custom styles to apply to the icons */
  css?: SerializedStyles
  /** The width of the icons */
  width?: number
  /** The height of the icons */
  height?: number
  /** The function to call when the load more button is clicked */
  onClick?: (event: React.MouseEvent, direction: HunkDirection) => void
}
