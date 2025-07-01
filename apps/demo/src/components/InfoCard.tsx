import { useDiffViewerConfig } from '@diff-viewer'
import { css } from '@emotion/react'
import { Card, Typography } from 'antd'
import { InfoCardProps } from './types'

const { Title, Paragraph, Text } = Typography

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    wrapper: css`
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
    `,
    card: css`
      background-color: ${theme.colors.backgroundContainer};
      border: 1px solid ${theme.colors.border};
    `,
  }
}

export default function InfoCard({ title, description }: InfoCardProps) {
  const styles = useStyles()

  return (
    <div css={styles.wrapper}>
      <Card css={styles.card} bordered={false}>
        <Title level={3}>{title}</Title>
        {description && (
          <Paragraph>{typeof description === 'string' ? <Text>{description}</Text> : description}</Paragraph>
        )}
      </Card>
    </div>
  )
}
