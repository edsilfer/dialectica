import { RichTooltip, ThemeContext } from '@dialectica-org/commons'
import { css } from '@emotion/react'
import React, { useContext } from 'react'
import { DiffActivitySummaryProps } from './types'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      align-items: center;
      cursor: default;
    `,
    label: css`
      margin-right: 4px;
      min-width: 4ch;
      font-size: ${theme.typography.regularFontSize}px;
      color: ${theme.colors.textPrimary};
    `,
    squaresContainer: css`
      display: flex;
      align-items: center;
    `,
    square: (color: string) => css`
      width: 10px;
      height: 10px;
      background-color: ${color};
      border: 1px solid ${theme.colors.backgroundPrimary};
      /* Prevent double borders between adjacent squares by removing the left border from every square except the first */
      &:not(:first-of-type) {
        border-left: none;
      }
      /* Add spacing between the numeric label and the first square */
      &:first-of-type {
        margin-left: 4px;
      }
    `,
  }
}

const DiffActivitySummary: React.FC<DiffActivitySummaryProps> = ({ additions, deletions, maxSquares = 5 }) => {
  const styles = useStyles()
  const theme = useContext(ThemeContext)

  const total = additions + deletions
  const tooltipText = `${additions} addition${
    additions !== 1 ? 's' : ''
  } & ${deletions} deletion${deletions !== 1 ? 's' : ''}`

  let squares: ('addition' | 'deletion' | 'neutral')[] = []

  if (total === 0) {
    squares = Array.from({ length: maxSquares }, () => 'neutral' as const)
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

    // Build the squares array with properly typed helpers to avoid any `any` leakage
    const additionSquaresArr = Array.from({ length: additionSquares }, () => 'addition' as const)
    const deletionSquaresArr = Array.from({ length: deletionSquares }, () => 'deletion' as const)
    const neutralSquaresArr = Array.from({ length: emptySquares }, () => 'neutral' as const)

    squares = [...additionSquaresArr, ...deletionSquaresArr, ...neutralSquaresArr]
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
    <div css={styles.container}>
      <RichTooltip tooltipText="additions + deletions)">
        <span css={styles.label} data-testid="diff-activity-total">
          {total}
        </span>
      </RichTooltip>

      <RichTooltip tooltipText={tooltipText}>
        <div css={styles.squaresContainer}>
          {squares.map((type, index) => (
            <div key={`${type}-${index}`} css={styles.square(getColor(type))} data-testid="diff-activity-square" />
          ))}
        </div>
      </RichTooltip>
    </div>
  )
}

export default DiffActivitySummary
