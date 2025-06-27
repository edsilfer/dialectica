import React, { useContext, useMemo } from 'react'
import { css } from '@emotion/react'
import type { FileDiff } from '../../../types/diff'
import { ThemeContext } from '../../../providers/theme-provider'
import RichTooltip from '../../shared/RichTooltip'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      align-items: center;
    `,
    square: (color: string) => css`
      width: ${theme.spacing.sm};
      height: ${theme.spacing.sm};
      background-color: ${color};
      border: 1px solid ${theme.colors.borderBg};
      border-radius: ${theme.spacing.xxs};
    `,
  }
}

interface FileActivitySummaryProps {
  /** The file diff object */
  file: FileDiff
  /** The maximum number of squares to display. Defaults to 10. */
  maxSquares?: number
}

const FileActivitySummary: React.FC<FileActivitySummaryProps> = ({ file, maxSquares = 5 }) => {
  const styles = useStyles()
  const theme = useContext(ThemeContext)

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

  const total = additions + deletions
  const tooltipText = `${additions} addition${
    additions !== 1 ? 's' : ''
  } & ${deletions} deletion${deletions !== 1 ? 's' : ''}`

  let squares: ('addition' | 'deletion' | 'neutral')[] = []

  if (total === 0) {
    squares = Array(maxSquares).fill('neutral')
  } else {
    let additionSquares = Math.round((additions / total) * maxSquares)
    let deletionSquares = maxSquares - additionSquares

    // Ensure that if there are additions/deletions, at least one square is shown
    if (additions > 0 && additionSquares === 0) {
      additionSquares = 1
      deletionSquares = maxSquares - 1
    } else if (deletions > 0 && deletionSquares === 0) {
      deletionSquares = 1
      additionSquares = maxSquares - 1
    }

    const emptySquares = maxSquares - (additionSquares + deletionSquares)

    squares = [
      ...Array(additionSquares).fill('addition'),
      ...Array(deletionSquares).fill('deletion'),
      ...Array(emptySquares).fill('neutral'),
    ]
  }

  const getColor = (type: 'addition' | 'deletion' | 'neutral') => {
    switch (type) {
      case 'addition':
        return theme.colors.addedSquareBg
      case 'deletion':
        return theme.colors.deletedSquareBg
      case 'neutral':
        return theme.colors.neutralSquareBg
    }
  }

  return (
    <RichTooltip tooltipText={tooltipText}>
      <div css={styles.container}>
        {squares.map((type, index) => (
          <div key={index} css={styles.square(getColor(type))} />
        ))}
      </div>
    </RichTooltip>
  )
}

export default FileActivitySummary
