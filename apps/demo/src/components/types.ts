import React from 'react'

export interface InfoCardProps {
  /** Title displayed using Typography.Title level 3 */
  title: React.ReactNode
  /** Additional descriptive text below the title */
  description?: React.ReactNode
}

export interface ErrorCardProps {
  /** Error instance whose message will be displayed */
  error: Error | null | undefined
  /** Override default title shown above the error message */
  title?: React.ReactNode
  /** Optional description (defaults to error.message) */
  description?: React.ReactNode
}
