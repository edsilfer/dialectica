import { useDiffViewerConfig } from '@diff-viewer'
import { css } from '@emotion/react'
import { Card, Typography } from 'antd'
import { theme as antdTheme } from 'antd'
import { ErrorCardProps } from './types'

const { Title, Paragraph, Text } = Typography

const useStyles = () => {
  const { theme } = useDiffViewerConfig()
  const { token } = antdTheme.useToken()

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
      border: 1px solid ${token.colorError};
    `,
    title: css`
      color: ${token.colorError};
    `,
  }
}

export default function ErrorCard({ error, title = 'Failed to load Pull Request', description }: ErrorCardProps) {
  const styles = useStyles()

  const descriptionContent = description ?? error?.message

  return (
    <div css={styles.wrapper}>
      <Card css={styles.card} bordered>
        <Title level={3} css={styles.title}>
          {title}
        </Title>
        {descriptionContent && (
          <Paragraph>
            {typeof descriptionContent === 'string' ? <Text>{descriptionContent}</Text> : descriptionContent}
          </Paragraph>
        )}
      </Card>
    </div>
  )
}
