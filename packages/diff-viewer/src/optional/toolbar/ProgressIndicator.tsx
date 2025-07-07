import { css } from '@emotion/react'
import { Progress, Typography } from 'antd'
import React, { useContext } from 'react'
import { ThemeContext } from '../../themes/providers/theme-context'

const { Text } = Typography

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    progressContainer: css`
      display: flex;
      flex-direction: column;
      width: 110px;
      align-items: center;
    `,

    progressText: css`
      color: ${theme.colors.textPrimary};
      font-size: 0.75rem;
      cursor: default;
    `,
  }
}

export const ProgressIndicator: React.FC<{ current: number; total: number; suffix: string }> = (props) => {
  const styles = useStyles()
  const percent = props.total > 0 ? Math.round((props.current / props.total) * 100) : 0

  return (
    <div css={styles.progressContainer}>
      <Text css={styles.progressText}>{`${props.current} / ${props.total} ${props.suffix}`}</Text>
      <Progress percent={percent} size="small" showInfo={false} />
    </div>
  )
}
