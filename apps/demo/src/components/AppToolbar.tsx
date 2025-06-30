import { SettingOutlined } from '@ant-design/icons'
import { ThemeTokens, useDiffViewerConfig } from '@diff-viewer'
import { css } from '@emotion/react'
import { Button, Typography } from 'antd'
import React from 'react'
import SettingsModal from './settings/SettingsModal'

const { Title, Text } = Typography

const useStyles = (theme: ThemeTokens) => ({
  horizontal: css`
    display: flex;
    flex-direction: row;
  `,
  vertical: css`
    display: flex;
    flex-direction: column;
  `,
  headers: css`
    margin: 0 !important;
    color: ${theme.colors.textPrimary} !important;
  `,
  settings: css`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    flex: 1;
    gap: ${theme.spacing.sm};
  `,
  settingsButton: css`
    display: flex;
    align-items: center;
  `,
})

const AppToolbar: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const { theme } = useDiffViewerConfig()

  const styles = useStyles(theme)

  return (
    <div css={styles.horizontal}>
      <div css={styles.vertical}>
        <Title level={4} css={styles.headers}>
          Awesome Diff Viewer
        </Title>
        <Text css={styles.headers}>
          Demo app for the <code>DiffViewer</code> component.
        </Text>
      </div>

      <div css={styles.settings}>
        <Button
          css={styles.settingsButton}
          type="default"
          icon={<SettingOutlined />}
          onClick={() => setSettingsOpen(true)}
          size="small"
        >
          Settings
        </Button>

        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </div>
  )
}

export default AppToolbar
