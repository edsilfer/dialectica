import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { ThemeContext } from '../../providers/theme-context'
import RichTooltip from '../RichTooltip'
import { DiffActivitySummaryProps } from './types'

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

const DiffActivitySummary: React.FC<DiffActivitySummaryProps> = ({
  additions,
  deletions,
  maxSquares = 5,
}) => {
  const styles = useStyles()
  const theme = useContext(ThemeContext)

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
        return theme.colors.fileViewerAddedSquareBg
      case 'deletion':
        return theme.colors.fileViewerDeletedSquareBg
      case 'neutral':
        return theme.colors.fileViwerNeutralSquareBg
    }
  }

  return (
    <RichTooltip tooltipText={tooltipText}>
      <div css={styles.container}>
        {squares.map((type, index) => (
          <div key={index} css={styles.square(getColor(type))} data-testid="diff-activity-square" />
        ))}
      </div>
    </RichTooltip>
  )
}

export default DiffActivitySummary
