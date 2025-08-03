import { css } from '@emotion/react'
import { Progress } from 'antd'
import { useIsMobile } from '../hooks/use-is-mobile'

const useStyles = () => {
  return {
    container: css`
      display: flex;
      min-width: 110px;
      flex-direction: column;

      @media (max-width: 768px) {
        min-width: 28px;
      }
    `,
  }
}

interface ProgressIndicatorProps {
  current: number
  total: number
  suffix?: string
}

export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  const styles = useStyles()
  const isMobile = useIsMobile()
  const safeTotal = Math.max(total, 1)
  const safeCurrent = Math.min(Math.max(current, 0), safeTotal)
  const percent = total <= 0 ? 100 : Math.round((safeCurrent / safeTotal) * 100)

  return (
    <div css={styles.container}>
      <Progress
        type={isMobile ? 'circle' : 'line'}
        percent={percent}
        size={isMobile ? 24 : undefined}
        showInfo={!isMobile}
        format={(pct) => (isMobile ? '' : `${pct}%`)}
      />
    </div>
  )
}
