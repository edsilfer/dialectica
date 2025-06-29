import { Themes, ThemeTokens } from '@diff-viewer'
import { css } from '@emotion/react'
import { Select, Switch, Typography } from 'antd'
import React from 'react'
import { useDiffViewerState } from '../providers/config-provider'

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
  configContainer: css`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex: 1;
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
  switchLabel: css`
    color: ${theme.colors.textPrimary} !important;
  `,
})

const AppHeader: React.FC = () => {
  const {
    theme,
    isSplitView,
    collapsePackages,
    showIcons,
    displayNodeDetails,
    setTheme,
    setIsSplitView,
    setCollapsePackages,
    setShowIcons,
    setDisplayNodeDetails,
  } = useDiffViewerState()
  const styles = useStyles(theme)

  return (
    <div css={styles.horizontal}>
      <div css={styles.vertical}>
        <Title level={2} css={styles.headers}>
          Awesome Diff Viewer
        </Title>
        <Text css={styles.headers}>
          Demo app for the <code>DiffViewer</code> component.
        </Text>
      </div>

      <div css={styles.configContainer}>
        <Select
          value={theme.name}
          css={styles.themeSelect}
          onChange={(value) => setTheme(Themes[value as keyof typeof Themes])}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'dracula', label: 'Dracula' },
            { value: 'solarizedDark', label: 'Solarized Dark' },
            { value: 'solarizedLight', label: 'Solarized Light' },
          ]}
        />
        <div css={styles.switchContainer}>
          <Text css={styles.switchLabel}>Split</Text>
          <Switch checked={isSplitView} onChange={setIsSplitView} size="small" />
          <Text css={styles.switchLabel}>Collapse Packages</Text>
          <Switch checked={collapsePackages} onChange={setCollapsePackages} size="small" />
          <Text css={styles.switchLabel}>Show Icons</Text>
          <Switch checked={showIcons} onChange={setShowIcons} size="small" />
          <Text css={styles.switchLabel}>Show Details</Text>
          <Switch checked={displayNodeDetails} onChange={setDisplayNodeDetails} size="small" />
        </div>
      </div>
    </div>
  )
}

export default AppHeader
