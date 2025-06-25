import React from 'react'
import type { ParsedDiff, DiffLine } from '../types/diff'
import FileViewer from './FileViewer'
import { css } from '@emotion/react'

const useStyles = () => ({
  container: css`
    display: flex;
    flex-direction: column;
  `,
})

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
  const styles = useStyles()

  return (
    <div css={styles.container}>
      {diff.files.map((file, index) => (
        <FileViewer key={index} file={file} />
      ))}
    </div>
  )
}
