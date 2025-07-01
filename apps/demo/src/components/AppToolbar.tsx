import { SettingOutlined } from '@ant-design/icons'
import { ThemeTokens, useDiffViewerConfig } from '@diff-viewer'
import { css } from '@emotion/react'
import { Button, Typography } from 'antd'
import React, { useState } from 'react'
import SearchForm from './search-form/SearchForm'
import SettingsModal from './settings/SettingsModal'
import { ParsedPR } from './search-form/types'

const { Title, Text } = Typography

const useStyles = (theme: ThemeTokens) => ({
  container: css`
    display: flex;
    flex-direction: row;
  `,
  titleContainer: css`
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
    flex: 1;
  `,
  settingsButton: css`
    display: flex;
    align-items: center;

    /* Smooth rotation animation for the icon */
    .anticon {
      transition: transform 0.3s ease;
    }

    /* Rotate the cog when the button is hovered */
    &:hover .anticon {
      transform: rotate(90deg);
    }
  `,
})

const AppToolbar: React.FC<{ onSearch: (pr: ParsedPR) => void }> = ({ onSearch }) => {
  const { theme } = useDiffViewerConfig()
  const styles = useStyles(theme)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div css={styles.container}>
      <div css={styles.titleContainer}>
        <Title level={4} css={styles.headers}>
          Awesome Diff Viewer
        </Title>
        <Text css={styles.headers}>
          Demo app for the <code>DiffViewer</code> component.
        </Text>
      </div>

      <div css={styles.settings}>
        <SearchForm onSearch={onSearch} />

        <Button
          css={styles.settingsButton}
          type="default"
          icon={<SettingOutlined />}
          onClick={() => setSettingsOpen(true)}
        >
          Settings
        </Button>

        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </div>
  )
}

export default AppToolbar
