import { CodePanel, DiffParserAdapter, FileExplorer, useDiffViewerConfig } from '@diff-viewer'
import { css } from '@emotion/react'
import { Tooltip, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'
import { TEN_FILES_DIFF } from './__fixtures__/sample-diffs'
import AppToolbar from './components/AppToolbar'
import HandleIcon from './components/icons/HandleIcon'
import PixelHeartIcon from './components/icons/PixelHeartIcon'
import { useResizablePanel } from './hooks/use-resizable-panel'

const { Text } = Typography

// Extracted outside the component to keep reference stable
const createStyles = (theme: ReturnType<typeof useDiffViewerConfig>['theme']) => ({
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
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.spacing.xs};
    overflow: auto;
  `,
  resizer: css`
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: col-resize;
    color: ${theme.colors.border};
  `,
  diffViewer: css`
    flex: 1;
    border-radius: ${theme.spacing.xs};
    overflow: auto;
  `,
  footer: css`
    display: flex;
    align-items: center;
    justify-content: center;
    * {
      font-size: 0.8rem !important;
    }
  `,
})

export default function App() {
  const { theme, fileExplorerConfig, codePanelConfig } = useDiffViewerConfig()

  // Memoize style object so Emotion doesn't recompute the classes on every drag frame
  const styles = useMemo(() => createStyles(theme), [theme])

  const parsedDiff = useMemo(() => new DiffParserAdapter().parse(TEN_FILES_DIFF), [])
  const [scrollToFile, setScrollToFile] = useState<string | null>(null)
  const { width: explorerWidth, containerRef, onMouseDown } = useResizablePanel()

  // Stable callback so FileExplorer receives an unchanged prop between drags
  // Prefer the new path when available, otherwise fall back to the old one
  const handleFileClick = useCallback((file: { newPath: string; oldPath: string }) => {
    setScrollToFile(file.newPath ?? file.oldPath)
  }, [])

  // Memoise heavy children so they don't re-render on width updates
  const fileExplorerElement = useMemo(
    () => (
      <FileExplorer
        key={JSON.stringify(fileExplorerConfig)}
        css={styles.fileExplorer}
        diff={parsedDiff}
        onFileClick={handleFileClick}
      />
    ),
    [parsedDiff, handleFileClick, styles.fileExplorer, fileExplorerConfig],
  )

  const codePanelElement = useMemo(
    () => (
      <CodePanel
        key={JSON.stringify(codePanelConfig)}
        css={styles.diffViewer}
        diff={parsedDiff}
        scrollTo={scrollToFile}
      />
    ),
    [parsedDiff, scrollToFile, styles.diffViewer, codePanelConfig],
  )

  return (
    <div css={styles.container}>
      <AppToolbar />

      <div css={styles.content} ref={containerRef}>
        {/* File explorer panel */}
        <div
          css={css`
            width: ${explorerWidth}%;
          `}
        >
          {fileExplorerElement}
        </div>

        {/* Drag handle */}
        <Tooltip title="Drag to resize" placement="right">
          <div css={styles.resizer} onMouseDown={onMouseDown}>
            <HandleIcon size={16} />
          </div>
        </Tooltip>

        {/* Diff viewer */}
        {codePanelElement}
      </div>

      <div css={styles.footer}>
        <Text>
          Made with
          <PixelHeartIcon size={16} />
          by edsilfer
        </Text>
      </div>
    </div>
  )
}
