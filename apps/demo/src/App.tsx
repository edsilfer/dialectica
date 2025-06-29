import { DiffParserAdapter, DiffViewer, FileExplorer, ThemeTokens } from '@diff-viewer'
import { css } from '@emotion/react'
import { useMemo, useState } from 'react'
import { TEN_FILES_DIFF } from './__fixtures__/sample-diffs'
import AppHeader from './components/AppHeader'
import { useResizablePanel } from './hooks/use-resizable-panel'
import { useDiffViewerState } from './providers/config-provider'
import HandleIcon from './components/HandleIcon'
import { Tooltip } from 'antd'

const useStyles = (theme: ThemeTokens) => ({
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
    flex: 1;
    gap: ${theme.spacing.xs};
    margin-top: ${theme.spacing.md};
    overflow: hidden;
  `,
  fileExplorer: css`
    height: 100%;
    padding: ${theme.spacing.md};
    border: 1px solid ${theme.colors.borderBg};
    border-radius: ${theme.spacing.xs};
    overflow: auto;
  `,
  resizer: css`
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: col-resize;
    color: ${theme.colors.textPrimary};
  `,
  diffViewer: css`
    flex: 1;
    border-radius: ${theme.spacing.xs};
    overflow: hidden;
  `,
})

export default function App() {
  const { theme, isSplitView, collapsePackages, showIcons, displayNodeDetails, wrapLines } =
    useDiffViewerState()
  const styles = useStyles(theme)

  const parsedDiff = useMemo(() => new DiffParserAdapter().parse(TEN_FILES_DIFF), [])
  const [scrollToFile, setScrollToFile] = useState<string | null>(null)
  const { width: explorerWidth, containerRef, onMouseDown } = useResizablePanel()

  return (
    <div css={styles.container}>
      <AppHeader />

      <div css={styles.content} ref={containerRef}>
        {/* File explorer panel */}
        <div
          css={css`
            width: ${explorerWidth}%;
          `}
        >
          <FileExplorer
            css={styles.fileExplorer}
            diff={parsedDiff}
            onFileClick={(file) => setScrollToFile(file.newPath || file.oldPath)}
            config={{
              theme,
              startExpanded: true,
              nodeConnector: 'dashed',
              indentPx: 20,
              collapsePackages,
              showIcons,
              displayNodeDetails,
              roundedConnectors: true,
            }}
          />
        </div>

        {/* Drag handle */}
        <Tooltip title="Drag to resize" placement="right">
          <div css={styles.resizer} onMouseDown={onMouseDown}>
            <HandleIcon size={16} />
          </div>
        </Tooltip>

        {/* Diff viewer */}
        <DiffViewer
          css={styles.diffViewer}
          diff={parsedDiff}
          scrollTo={scrollToFile}
          config={{
            theme,
            mode: isSplitView ? 'split' : 'unified',
            showLineNumbers: true,
            wrapLines,
          }}
        />
      </div>
    </div>
  )
}
