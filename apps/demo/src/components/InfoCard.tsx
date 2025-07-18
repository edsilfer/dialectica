import React from 'react'
import { useDiffViewerConfig } from '@diff-viewer'
import { css } from '@emotion/react'
import { Card, Typography } from 'antd'

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

export interface InfoCardProps {
  /** Title displayed using Typography.Title level 3 */
  title: React.ReactNode
  /** Additional descriptive text below the title */
  description?: React.ReactNode
}

export default function InfoCard({ title, description }: InfoCardProps) {
  const styles = useStyles()

  return (
    <div css={styles.wrapper}>
      <Card css={styles.card} variant="outlined">
        <Title level={3}>{title}</Title>
        {description && (
          <Paragraph>{typeof description === 'string' ? <Text>{description}</Text> : description}</Paragraph>
        )}
      </Card>
    </div>
  )
}
