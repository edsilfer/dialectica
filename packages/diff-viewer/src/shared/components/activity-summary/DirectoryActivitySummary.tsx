import React, { useMemo } from 'react'
import DiffActivitySummary from './DiffActivitySummary'
import { DirectoryActivitySummaryProps } from './types'

const DirectoryActivitySummary: React.FC<DirectoryActivitySummaryProps> = ({ files, maxSquares = 5 }) => {
  const { additions, deletions } = useMemo(() => {
    let additions = 0
    let deletions = 0
    for (const file of files) {
      for (const hunk of file.hunks) {
        for (const change of hunk.changes) {
          if (change.type === 'add') {
            additions++
          } else if (change.type === 'delete') {
            deletions++
          }
        }
      }
    }
    return { additions, deletions }
  }, [files])

  return <DiffActivitySummary additions={additions} deletions={deletions} maxSquares={maxSquares} />
}

export default DirectoryActivitySummary
