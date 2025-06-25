import React from 'react'
import type { ParsedDiff, DiffLine } from '../types/diff'

export type DiffViewerProps = {
  // Configuration__________________________________________________
  /** The parsed diff to display. */
  diff: ParsedDiff
  /** The mode to display the diff in. */
  mode?: 'unified' | 'side-by-side'
  /** Whether to highlight the syntax of the diff. */
  highlightSyntax?: boolean
  /** Whether to ignore whitespace in the diff. */
  ignoreWhitespace?: boolean

  // Callbacks____________________________________________________
  /** Callback for when a line is clicked. */
  onLineClick?: (line: DiffLine) => void
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff, mode }) => {
  return (
    <div className={`diff-viewer diff-viewer--${mode}`}>
      Hello World!
    </div>
  )
}
