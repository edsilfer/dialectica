import React, { useMemo } from 'react'
import { FileDiff } from '../../../diff-viewer/types'
import DiffActivitySummary from './DiffActivitySummary'

interface FileActivitySummaryProps {
  /** The file diff object */
  file: FileDiff
  /** The maximum number of squares to display. Defaults to 10. */
  maxSquares?: number
}

const FileActivitySummary: React.FC<FileActivitySummaryProps> = ({ file, maxSquares = 5 }) => {
  const { additions, deletions } = useMemo(() => {
    let additions = 0
    let deletions = 0
    for (const hunk of file.hunks) {
      for (const change of hunk.changes) {
        if (change.type === 'add') {
          additions++
        } else if (change.type === 'delete') {
          deletions++
        }
      }
    }
    return { additions, deletions }
  }, [file])

  return <DiffActivitySummary additions={additions} deletions={deletions} maxSquares={maxSquares} />
}

export default FileActivitySummary
