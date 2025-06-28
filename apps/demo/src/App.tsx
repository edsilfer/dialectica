import { DiffParserAdapter, DiffViewer, FileExplorer, ThemeTokens } from '@diff-viewer'
import { css } from '@emotion/react'
import { useState } from 'react'
import { TEN_FILES_DIFF } from './__fixtures__/sample-diffs'
import AppHeader from './components/AppHeader'
import { useDiffViewerState } from './providers/config-provider'

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
  const { theme, isSplitView, collapsePackages, showIcons, displayNodeDetails } =
    useDiffViewerState()
  const [scrollToFile, setScrollToFile] = useState<string | null>(null)
  const styles = useStyles(theme)
  const parser = new DiffParserAdapter()
  const parsedDiff = parser.parse(TEN_FILES_DIFF)

  return (
    <div css={styles.container}>
      <AppHeader />

      <div css={styles.content}>
        <FileExplorer
          css={styles.fileExplorer}
          diff={parsedDiff}
          onFileClick={(file) => setScrollToFile(file.newPath || file.oldPath)}
          config={{
            theme: theme,
            startExpanded: true,
            nodeConnector: 'dashed',
            indentPx: 20,
            collapsePackages,
            showIcons: showIcons,
            displayNodeDetails: displayNodeDetails,
            roundedConnectors: true,
          }}
        />

        <DiffViewer
          css={styles.diffViewer}
          diff={parsedDiff}
          scrollTo={scrollToFile}
          config={{
            theme: theme,
            mode: isSplitView ? 'split' : 'unified',
            showLineNumbers: true,
          }}
        />
      </div>
    </div>
  )
}
