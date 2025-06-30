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
  themeSelect: css`
    width: 200px;

    /* the part that draws the grey/white rectangle */
    & .ant-select-selector {
      background-color: ${theme.colors.hunkViewerBg} !important;
      color: ${theme.colors.textPrimary} !important;
    }

    /* the item text itself */
    & .ant-select-selection-item,
    & .ant-select-selection-placeholder {
      color: ${theme.colors.textPrimary} !important;
    }
  `,
  switchContainer: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: ${theme.spacing.sm};
    margin-top: ${theme.spacing.sm};
  `,
  modalContent: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.md};
    margin-top: ${theme.spacing.md};
  `,
  switchLabel: css`
    color: ${theme.colors.textPrimary} !important;
  `,
  sectionTitle: css`
    color: ${theme.colors.textPrimary} !important;
    margin-top: ${theme.spacing.sm};
    margin-bottom: ${theme.spacing.xs};
  `,
  settingContainer: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
  `,
  input: css`
    background-color: ${theme.colors.hunkViewerBg} !important;
    color: ${theme.colors.textPrimary} !important;
  `,
})

const AppToolbar: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const {
    theme,
    setTheme,
    codePanelConfig,
    fileExplorerConfig,
    setCodePanelConfig,
    setFileExplorerConfig,
  } = useDiffViewerConfig()

  const isSplitView = codePanelConfig.mode === 'split'
  const collapsePackages = fileExplorerConfig.collapsePackages ?? false
  const showIcons = fileExplorerConfig.showIcons ?? false
  const displayNodeDetails = fileExplorerConfig.displayNodeDetails ?? false

  const setIsSplitView = (value: boolean) =>
    setCodePanelConfig((cfg) => ({ ...cfg, mode: value ? 'split' : 'unified' }))
  const setCollapsePackages = (value: boolean) =>
    setFileExplorerConfig((cfg) => ({ ...cfg, collapsePackages: value }))
  const setShowIcons = (value: boolean) =>
    setFileExplorerConfig((cfg) => ({ ...cfg, showIcons: value }))
  const setDisplayNodeDetails = (value: boolean) =>
    setFileExplorerConfig((cfg) => ({ ...cfg, displayNodeDetails: value }))

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
