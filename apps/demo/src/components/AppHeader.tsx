import { Themes, ThemeTokens } from '@diff-viewer'
import { css } from '@emotion/react'
import { Select, Switch, Typography } from 'antd'
import React from 'react'

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

interface AppHeaderProps {
  /** The selected theme. */
  selectedTheme: ThemeTokens
  /** Whether to show the split view. */
  isSplitView: boolean
  /** Whether to collapse the packages. */
  collapsePackages: boolean

  // Callbacks ____________________________________________
  /** Callback to change the theme. */
  onThemeChange: (theme: ThemeTokens) => void
  /** Callback to change the split view. */
  onSplitViewChange: (checked: boolean) => void
  /** Callback to change the collapse packages. */
  onCollapsePackagesChange: (checked: boolean) => void
}

const AppHeader: React.FC<AppHeaderProps> = ({
  selectedTheme,
  isSplitView,
  collapsePackages,
  onThemeChange,
  onSplitViewChange,
  onCollapsePackagesChange,
}) => {
  const styles = useStyles(selectedTheme)

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

      <div css={styles.vertical} style={{ marginLeft: 'auto' }}>
        <Select
          defaultValue="light"
          css={styles.themeSelect}
          onChange={(value) => onThemeChange(Themes[value as keyof typeof Themes])}
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
          <Switch checked={isSplitView} onChange={onSplitViewChange} size="small" />
          <Text css={styles.switchLabel}>Collapse Packages</Text>
          <Switch checked={collapsePackages} onChange={onCollapsePackagesChange} size="small" />
        </div>
      </div>
    </div>
  )
}

export default AppHeader
