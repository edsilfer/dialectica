import { css } from '@emotion/react'
import { Progress, Typography } from 'antd'
import { useContext } from 'react'
import { ThemeContext } from '../themes/providers/theme-context'

const { Text } = Typography

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    progressContainer: css`
      display: flex;
      flex-direction: column;
      width: 110px;
      align-items: center;
      white-space: nowrap;
      overflow: hidden;
    `,

    progressText: css`
      color: ${theme.colors.textPrimary};
      font-size: 0.75rem;
      cursor: default;
    `,
  }
}

interface ProgressIndicatorProps {
  /** Current progress (0 ≤ current ≤ total) */
  current: number
  /** Total value (> 0) */
  total: number
  /** Optional suffix text (e.g., 'files', 'items') */
  suffix?: string
}

/**
 * Shows a horizontal progress indicator with text and progress bar.
 */
export function ProgressIndicator(props: ProgressIndicatorProps) {
  const styles = useStyles()

  // Handle total = 0 as special case (infinite progress)
  if (props.total <= 0) {
    return (
      <div css={styles.progressContainer}>
        <Text css={styles.progressText}>{`infinite (total ${props.total})`}</Text>
        <Progress percent={100} size="small" showInfo={false} />
      </div>
    )
  }

  // Normal case: total > 0
  const safeTotal = props.total
  const safeCurrent = Math.min(Math.max(props.current, 0), safeTotal)
  const percent = Math.round((safeCurrent / safeTotal) * 100)

  return (
    <div css={styles.progressContainer}>
      <Text css={styles.progressText}>{`${safeCurrent} / ${safeTotal}${props.suffix ? ` ${props.suffix}` : ''}`}</Text>
      <Progress percent={percent} size="small" showInfo={false} />
    </div>
  )
}
