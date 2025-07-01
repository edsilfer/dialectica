import { ExclamationCircleOutlined } from '@ant-design/icons'
import { useDiffViewerConfig } from '@diff-viewer'
import { css } from '@emotion/react'
import { theme as antdTheme, Card, Typography } from 'antd'
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

      & .ant-card {
        border: 1px solid ${theme.colors.border};
        background-color: ${theme.colors.backgroundContainer};
      }
    `,

    vertical: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.sm};
    `,

    horizontal: css`
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: ${theme.spacing.sm};
    `,

    errorIcon: css`
      font-size: 24px !important;
      color: ${token.colorError};
      margin-top: ${theme.spacing.xs};
    `,

    title: css`
      margin: 0 !important;
      padding: 0 !important;
    `,
  }
}

export default function ErrorCard({ error, title = 'Failed to load Pull Request', description }: ErrorCardProps) {
  const styles = useStyles()

  const descriptionContent = description ?? error?.message

  return (
    <div css={styles.wrapper}>
      <Card>
        <div css={styles.horizontal}>
          <ExclamationCircleOutlined css={styles.errorIcon} />
          <div css={styles.vertical}>
            <Title level={3} css={styles.title}>
              {title}
            </Title>
            {descriptionContent && (
              <Paragraph>
                {typeof descriptionContent === 'string' ? <Text>{descriptionContent}</Text> : descriptionContent}
              </Paragraph>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
