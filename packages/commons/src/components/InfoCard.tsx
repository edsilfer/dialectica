import { css } from '@emotion/react'
import { Card, Typography } from 'antd'
import React, { useContext } from 'react'
import { ThemeContext } from '../themes'

const { Title, Paragraph, Text } = Typography

const useStyles = () => {
  const theme = useContext(ThemeContext)

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

interface InfoCardProps {
  /** Title displayed using Typography.Title level 3 */
  title: React.ReactNode
  /** Additional descriptive text below the title */
  description?: React.ReactNode
  /** Additional CSS class name */
  className?: string
  /** Additional CSS styles */
  style?: React.CSSProperties
}

export function InfoCard({ title, description, className, style }: InfoCardProps) {
  const styles = useStyles()

  return (
    <div css={styles.wrapper} className={className} style={style}>
      <Card css={styles.card} variant="outlined">
        <Title level={3}>{title}</Title>
        {description && (
          <Paragraph>{typeof description === 'string' ? <Text>{description}</Text> : description}</Paragraph>
        )}
      </Card>
    </div>
  )
}
