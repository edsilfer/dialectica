import { css } from '@emotion/react'
import { Typography, Checkbox } from 'antd'
import React, { useContext, useMemo, useState } from 'react'
import type { FileDiff, DisplayConfig } from '../../types'
import UnifiedViewer from '../line-viewer/UnifiedViewer'
import SplitedViewer from '../line-viewer/SplitViewer'
import { detectLanguage } from '../../parsers/language-utils'
import { ThemeContext } from '../../../shared/providers/theme-provider'
import CopyButton from './CopyButton'
import ExpandButton from './ExpandButton'
import FileActivitySummary from '../../../shared/components/activity-summary/FileActivitySummary'
import { buildSplitHunkPairs, highlightContent, escapeHtml } from '../line-viewer/line-utils'
import type { LineWithHighlight, SplitLinePair } from '../line-viewer/types'

const { Text } = Typography

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
      border: 1px solid ${theme.colors.borderBg};
      border-radius: ${theme.spacing.xs};
      overflow: hidden;
      flex: 0 0 auto;
    `,
    header: css`
      display: flex;
      flex-direction: row;
      gap: ${theme.spacing.xs};
      align-items: center;
      padding: ${theme.spacing.sm};
      color: ${theme.colors.textPrimary};
      font-family: ${theme.typography.codeFontFamily};
      border-bottom: 1px solid ${theme.colors.borderBg};
      background-color: ${theme.colors.fileViewerHeaderBg};

      .file-path {
        color: ${theme.colors.textPrimary};
      }
    `,
    viewedCheckbox: css`
      margin-left: auto;
      color: ${theme.colors.textPrimary};
    `,
    hunksContainer: css`
      display: flex;
      flex-direction: column;
    `,
  }
}

interface FileViewerProps {
  /** A unique identifier for the file viewer. */
  id?: string
  /** The file diff object. */
  file: FileDiff
  /** The display configuration options. */
  config: DisplayConfig
}

const FileViewer: React.FC<FileViewerProps> = ({ id, file, config }) => {
  const styles = useStyles()
  const [collapsed, setCollapsed] = useState(false)
  const [viewed, setViewed] = useState(false)
  const language = useMemo(() => detectLanguage(file.newPath), [file.newPath])
  const filePath = useMemo(
    () => (file.oldPath === file.newPath ? file.newPath : `${file.oldPath} → ${file.newPath}`),
    [file.oldPath, file.newPath],
  )

  // Pre-compute flattened line arrays for both display modes so we can directly
  // pass them to the corresponding viewer components. The expensive work is
  // memoised and will only run when the hunks or the detected language change.
  const unifiedLines = useMemo<LineWithHighlight[]>(() => {
    return file.hunks.flatMap((hunk) => {
      const headerLine: LineWithHighlight = {
        type: 'hunk',
        content: escapeHtml(hunk.content),
        highlightedContent: escapeHtml(hunk.content),
        lineNumberOld: null,
        lineNumberNew: null,
      }

      const contentLines: LineWithHighlight[] = hunk.changes
        .filter((line) => line.content.trim() !== '')
        .map((line) => ({
          ...line,
          highlightedContent: highlightContent(line.content, language),
        })) as unknown as LineWithHighlight[]

      return [headerLine, ...contentLines]
    })
  }, [file.hunks, language])

  const splitPairs = useMemo<SplitLinePair[]>(
    () => file.hunks.flatMap((hunk) => buildSplitHunkPairs(hunk, language)),
    [file.hunks, language],
  )

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed)
  }

  const handleCopyFilePath = () => {
    navigator.clipboard.writeText(filePath).catch((error) => {
      console.error(error)
    })
  }

  const handleToggleViewed = (checked: boolean) => {
    setViewed(checked)
    if (!checked || !collapsed) {
      handleToggleCollapse()
    }
  }

  return (
    <div css={styles.container} id={id}>
      <div css={styles.header}>
        <ExpandButton collapsed={collapsed} size={16} onClick={handleToggleCollapse} />
        <FileActivitySummary file={file} />
        <Text className="file-path">{filePath}</Text>
        <CopyButton
          onClick={handleCopyFilePath}
          tooltip="Copy file path"
          toastText="File path copied to clipboard"
        />
        <Checkbox
          css={styles.viewedCheckbox}
          checked={viewed}
          onChange={(e) => handleToggleViewed(e.target.checked)}
        >
          Viewed
        </Checkbox>
      </div>

      {!collapsed && config.mode === 'split' && (
        <div css={styles.hunksContainer}>
          <SplitedViewer pairs={splitPairs} config={config} />
        </div>
      )}

      {!collapsed && config.mode === 'unified' && (
        <div css={styles.hunksContainer}>
          <UnifiedViewer lines={unifiedLines} config={config} />
        </div>
      )}
    </div>
  )
}

export default FileViewer
