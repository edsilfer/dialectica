import { DiffParserAdapter, DiffViewer, FileExplorer, Themes, ThemeTokens } from '@diff-viewer'
import { css } from '@emotion/react'
import { useState } from 'react'
import { SAMPLE_DIFF, TEN_FILES_DIFF } from './__fixtures__/sample-diffs'
import AppHeader from './components/AppHeader'

const useStyles = (theme: ThemeTokens) => {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      padding: ${theme.spacing.md};
      background-color: ${theme.colors.hunkViewerBg};
      overflow: hidden;
    `,
    content: css`
      display: flex;
      flex-direction: row;
      height: 100%;
      flex: 1;
      gap: ${theme.spacing.md};
      margin-top: ${theme.spacing.md};
      overflow: hidden;
    `,
    fileExplorer: css`
      width: 25%;
      height: 100%;
      padding: ${theme.spacing.md};
      border: 1px solid ${theme.colors.borderBg};
      border-radius: ${theme.spacing.xs};
      overflow: auto;
    `,
    diffViewer: css`
      flex: 1;
      border-radius: ${theme.spacing.xs};
      overflow-y: auto;
      overflow-x: hidden;
    `,
  }
}

export default function App() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeTokens>(Themes.light)
  const [isSplitView, setIsSplitView] = useState(false)
  const [collapsePackages, setCollapsePackages] = useState(true)
  const [scrollToFile, setScrollToFile] = useState<string | null>(null)
  const styles = useStyles(selectedTheme)
  const parser = new DiffParserAdapter()
  const parsedDiff = parser.parse(TEN_FILES_DIFF)

  return (
    <div css={styles.container}>
      <AppHeader
        selectedTheme={selectedTheme}
        onThemeChange={setSelectedTheme}
        isSplitView={isSplitView}
        onSplitViewChange={setIsSplitView}
        collapsePackages={collapsePackages}
        onCollapsePackagesChange={setCollapsePackages}
      />

      <div css={styles.content}>
        <FileExplorer
          css={styles.fileExplorer}
          diff={parsedDiff}
          onFileClick={(file) => setScrollToFile(file.newPath || file.oldPath)}
          config={{
            theme: selectedTheme,
            startExpanded: true,
            nodeConnector: 'solid',
            indentPx: 20,
            collapsePackages,
            showIcons: true,
          }}
        />

        <DiffViewer
          css={styles.diffViewer}
          diff={parsedDiff}
          scrollTo={scrollToFile}
          config={{
            theme: selectedTheme,
            mode: isSplitView ? 'split' : 'unified',
            showLineNumbers: true,
          }}
        />
      </div>
    </div>
  )
}
