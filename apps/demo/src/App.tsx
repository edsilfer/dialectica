import { DiffParserAdapter, DiffViewer, Themes, ThemeTokens } from '@diff-viewer'
import { css } from '@emotion/react'
import { Select, Switch, Typography } from 'antd'
import { useState } from 'react'
import { SAMPLE_DIFF } from './__fixtures__/sample-diffs'

const { Title, Text } = Typography

const useStyles = (theme: ThemeTokens) => {
  return {
    mainContainer: css`
      display: flex;
      flex-direction: column;
      height: 100vh;
      padding: ${theme.spacing.md};
      background-color: ${theme.colors.hunkViewerBg};
    `,
    horizontalContainer: css`
      display: flex;
      flex-direction: row;
    `,
    verticalContainer: css`
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
    diffViewer: css`
      margin-top: ${theme.spacing.md};
    `,
  }
}

export default function App() {
  const [selectedTheme, setSelectedTheme] = useState(Themes.light)
  const [isSplitView, setIsSplitView] = useState(false)
  const styles = useStyles(selectedTheme)
  const parser = new DiffParserAdapter()
  const parsedDiff = parser.parse(SAMPLE_DIFF)

  return (
    <div css={styles.mainContainer}>
      <div css={styles.horizontalContainer}>
        <div css={styles.verticalContainer}>
          <Title level={2} css={styles.headers}>
            Awesome Diff Viewer
          </Title>
          <Text css={styles.headers}>
            Demo app for the <code>DiffViewer</code> component.
          </Text>
        </div>

        <div css={styles.verticalContainer} style={{ marginLeft: 'auto' }}>
          <Select
            defaultValue="light"
            css={styles.themeSelect}
            onChange={(value) => setSelectedTheme(Themes[value as keyof typeof Themes])}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'dracula', label: 'Dracula' },
              { value: 'solarizedDark', label: 'Solarized Dark' },
              { value: 'solarizedLight', label: 'Solarized Light' },
            ]}
          />
          <div css={styles.switchContainer}>
            <Text css={styles.switchLabel}>Split View</Text>
            <Switch checked={isSplitView} onChange={setIsSplitView} size="small" />
          </div>
        </div>
      </div>

      <DiffViewer
        css={styles.diffViewer}
        diff={parsedDiff}
        displayConfig={{ mode: isSplitView ? 'split' : 'unified', showLineNumbers: true }}
        theme={selectedTheme}
      />
    </div>
  )
}
