import React from 'react'

export interface ErrorCardProps {
  /** Error instance whose message will be displayed */
  error: Error | null | undefined
  /** Override default title shown above the error message */
  title?: React.ReactNode
  /** Optional description (defaults to error.message) */
  description?: React.ReactNode
}
