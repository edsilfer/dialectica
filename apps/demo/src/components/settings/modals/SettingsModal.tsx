import { ThemeContext, Themes } from '@dialectica-org/commons'
import { useDiffViewerConfig, useFileExplorerConfig, useFileListConfig } from '@dialectica-org/diff-viewer'
import { css } from '@emotion/react'
import { Divider, Modal } from 'antd'
import React, { useContext, useEffect, useState } from 'react'
import { useSettings } from '../../../hooks/use-settings'
import SettingsSection from '../Section'
import { SettingsModalProps } from '../types'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
      margin-top: ${theme.spacing.md};
    `,
  }
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const styles = useStyles()
  const { config, setConfig } = useDiffViewerConfig()

  const { config: fileExplorerConfig, setConfig: setFileExplorerConfig } = useFileExplorerConfig()
  const { config: fileListConfig, setConfig: setFileListConfig } = useFileListConfig()
  const { githubPat, useMocks, enableTutorial, setGithubPat, setUseMocks, setEnableTutorial } = useSettings()

  const [localGitHubPat, setLocalGitHubPat] = useState<string>(githubPat)
  const [maxFileLines, setMaxFileLines] = useState<number>(fileListConfig?.maxFileLines)
  const [maxLinesToFetch, setMaxLinesToFetch] = useState<number>(fileListConfig?.maxLinesToFetch)

  const collapsePackages = fileExplorerConfig.collapsePackages ?? false
  const showIcons = fileExplorerConfig.showIcons ?? false
  const displayNodeDetails = fileExplorerConfig.displayNodeDetails ?? false

  const setCollapsePackages = (value: boolean) =>
    setFileExplorerConfig((cfg: typeof fileExplorerConfig) => ({ ...cfg, collapsePackages: value }))

  const setShowIcons = (value: boolean) =>
    setFileExplorerConfig((cfg: typeof fileExplorerConfig) => ({ ...cfg, showIcons: value }))

  const setDisplayNodeDetails = (value: boolean) =>
    setFileExplorerConfig((cfg: typeof fileExplorerConfig) => ({ ...cfg, displayNodeDetails: value }))

  const setIsSplitView = (value: boolean) =>
    setFileListConfig((cfg: typeof fileListConfig) => ({ ...cfg, mode: value ? 'split' : 'unified' }))

  const setMaxLinesToFetchConfig = (value: number) => {
    setMaxLinesToFetch(value)
    setFileListConfig((cfg: typeof fileListConfig) => ({ ...cfg, maxLinesToFetch: value }))
  }

  const setMaxFileLinesConfig = (value: number) => {
    setMaxFileLines(value)
    setFileListConfig((cfg: typeof fileListConfig) => ({ ...cfg, maxFileLines: value }))
  }

  useEffect(() => {
    if (!open) setGithubPat(localGitHubPat)
  }, [open, localGitHubPat, setGithubPat])

  return (
    <Modal open={open} onOk={onClose} onCancel={onClose} footer={null} centered>
      <div css={styles.container}>
        <SettingsSection
          title="Global Settings"
          description="Options that affect the entire diff viewer application."
          settings={[
            {
              type: 'select',
              label: 'Color Theme',
              description: 'Application-wide color theme.',
              value: config.theme.name,
              onChange: (value: string) => setConfig((cfg: typeof config) => ({ ...cfg, theme: Themes[value] })),
              options: [
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'dracula', label: 'Dracula' },
                { value: 'solarizedDark', label: 'Solarized Dark' },
                { value: 'solarizedLight', label: 'Solarized Light' },
                { value: 'vscodeDark', label: 'VSCode Dark' },
              ],
            },
            {
              type: 'input',
              label: 'GitHub API Token',
              description: 'Optional token for GitHub API requests.',
              value: localGitHubPat,
              placeholder: '********',
              inputType: 'password',
              onChange: setLocalGitHubPat,
            },
            {
              type: 'switch',
              label: 'Use mock data',
              description: 'Toggle between using mock data or real GitHub API calls.',
              checked: useMocks,
              onChange: setUseMocks,
            },
            {
              type: 'switch',
              label: 'Enable tutorial',
              description: 'True by default. Disable to hide the tutorial.',
              checked: enableTutorial,
              onChange: setEnableTutorial,
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
              description: 'Render additional metadata such as additions / deletions next to each node.',
              checked: displayNodeDetails,
              onChange: setDisplayNodeDetails,
            },
          ]}
        />

        <Divider />

        <SettingsSection
          title="File List"
          description="Options that control how diffs are displayed in the code viewer."
          settings={[
            {
              type: 'switch',
              label: 'Split view mode',
              description: 'Toggle between unified (single column) and split (side-by-side) diff presentation.',
              checked: fileListConfig?.mode === 'split',
              onChange: setIsSplitView,
            },
            {
              type: 'input',
              inputType: 'number',
              label: 'Max lines to pre load',
              description: 'Max lines to preload for a file. (default: 400)',
              placeholder: '400',
              value: maxFileLines.toString(),
              onChange: (value: string) => setMaxFileLinesConfig(parseInt(value)),
            },
            {
              type: 'input',
              inputType: 'number',
              label: 'Max context lines to fetch',
              description: 'Max lines to fetch on load more (default: 10)',
              placeholder: '10',
              value: maxLinesToFetch.toString(),
              onChange: (value: string) => setMaxLinesToFetchConfig(parseInt(value)),
            },
          ]}
        />
      </div>
    </Modal>
  )
}

export default SettingsModal
