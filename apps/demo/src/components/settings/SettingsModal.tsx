import { Themes, ThemeTokens, useDiffViewerConfig } from '@diff-viewer'
import { css } from '@emotion/react'
import { Divider, Modal } from 'antd'
import React from 'react'
import SettingsSection from './Section'
import { SettingsModalProps } from './types'

const useStyles = (theme: ThemeTokens) => ({
  container: css`
    display: flex;
    flex-direction: column;
    margin-top: ${theme.spacing.md};
  `,
})

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
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
    <Modal open={open} onOk={onClose} onCancel={onClose} footer={null}>
      <div css={styles.container}>
        <SettingsSection
          title="Global Settings"
          description="Options that affect the entire diff viewer application."
          settings={[
            {
              type: 'select',
              label: 'Color Theme',
              description: 'Application-wide color theme.',
              value: theme.name,
              onChange: (value: string) => setTheme(Themes[value as keyof typeof Themes]),
              options: [
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'dracula', label: 'Dracula' },
                { value: 'solarizedDark', label: 'Solarized Dark' },
                { value: 'solarizedLight', label: 'Solarized Light' },
              ],
            },
            {
              type: 'input',
              label: 'GitHub API Token',
              description: 'Optional token for GitHub API requests.',
              value: '',
              placeholder: '********',
              inputType: 'password',
              onChange: (value: string) => console.log('WIP'),
            },
          ]}
        />

        <Divider />

        <SettingsSection
          title="File Explorer"
          description="Customize how the file and directory tree is rendered."
          settings={[
            {
              type: 'switch',
              label: 'Collapse package folders',
              description: 'Combine nested dirs into a single entry to make the tree more compact.',
              checked: collapsePackages,
              onChange: setCollapsePackages,
            },
            {
              type: 'switch',
              label: 'Show icons',
              description: 'Display an icon next to each file and folder based on its type.',
              checked: showIcons,
              onChange: setShowIcons,
            },
            {
              type: 'switch',
              label: 'Show node details',
              description:
                'Render additional metadata such as additions / deletions next to each node.',
              checked: displayNodeDetails,
              onChange: setDisplayNodeDetails,
            },
          ]}
        />

        <Divider />

        <SettingsSection
          title="Code Panel"
          description="Options that control how diffs are displayed in the code viewer."
          settings={[
            {
              type: 'switch',
              label: 'Split view mode',
              description:
                'Toggle between unified (single column) and split (side-by-side) diff presentation.',
              checked: isSplitView,
              onChange: setIsSplitView,
            },
          ]}
        />
      </div>
    </Modal>
  )
}

export default SettingsModal
