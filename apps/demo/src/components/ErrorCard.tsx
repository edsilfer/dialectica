import { ExclamationCircleOutlined, SettingOutlined } from '@ant-design/icons'
import { useTheme } from '@edsilfer/diff-viewer'
import { css } from '@emotion/react'
import { theme as antdTheme, Button, Card, Typography } from 'antd'
import React, { useState } from 'react'
import SettingsModal from './settings/modals/SettingsModal'

const { Title, Paragraph, Text } = Typography

const useStyles = () => {
  const theme = useTheme()
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

    settingsButton: css`
      display: flex;
      align-items: center;
      margin-top: ${theme.spacing.sm};

      /* Smooth rotation animation for the icon */
      .anticon {
        transition: transform 0.3s ease;
      }

      /* Rotate the cog when the button is hovered */
      &:hover .anticon {
        transform: rotate(90deg);
      }
    `,
  }
}

interface ErrorCardProps {
  /** Error instance whose message will be displayed */
  error: Error | null | undefined
  /** Override default title shown above the error message */
  title?: React.ReactNode
  /** Optional description (defaults to error.message) */
  description?: React.ReactNode
}

export default function ErrorCard({ error, title = 'Failed to load Pull Request', description }: ErrorCardProps) {
  const styles = useStyles()
  const [settingsOpen, setSettingsOpen] = useState(false)

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
            <Button
              css={styles.settingsButton}
              type="default"
              icon={<SettingOutlined />}
              onClick={() => setSettingsOpen(true)}
            >
              Settings
            </Button>
          </div>
        </div>
      </Card>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
