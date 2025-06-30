import { css } from '@emotion/react'
import { Checkbox, Tooltip, Typography } from 'antd'
import React, { useContext, useMemo, useState } from 'react'
import FileActivitySummary from '../../../shared/components/activity-summary/FileActivitySummary'
import WrapLines from '../../../shared/components/icons/WrapLines'
import { ThemeContext } from '../../../shared/providers/theme-provider'
import { detectLanguage } from '../../parsers/language-utils'
import { useDiffViewerConfig } from '../../providers/diff-viewer-context'
import type { FileDiff } from '../../types'
import { buildSplitHunkPairs, escapeHtml, highlightContent } from '../line-viewer/line-utils'
import SplitViewer from '../line-viewer/SplitViewer'
import type { LineWithHighlight, SplitLinePair } from '../line-viewer/types'
import UnifiedViewer from '../line-viewer/UnifiedViewer'
import CopyButton from './CopyButton'
import ExpandButton from './ExpandButton'

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

    body: css`
      border: 1px solid ${theme.colors.borderBg};
      border-top: none;
      border-bottom-left-radius: ${theme.spacing.xs};
      border-bottom-right-radius: ${theme.spacing.xs};
      overflow: hidden;
    `,

    header: css`
      display: flex;
      flex-direction: row;
      gap: ${theme.spacing.xs};
      align-items: center;
      padding: ${theme.spacing.sm};
      color: ${theme.colors.textPrimary};
      font-family: ${theme.typography.codeFontFamily};
      border: 1px solid ${theme.colors.borderBg};
      border-bottom: 1px solid ${theme.colors.borderBg};
      border-top-left-radius: ${theme.spacing.xs};
      border-top-right-radius: ${theme.spacing.xs};
      background-color: ${theme.colors.fileViewerHeaderBg};
      position: sticky;
      top: 0;
      z-index: 5;

      .file-path {
        color: ${theme.colors.textPrimary};
      }
    `,

    rightContainer: css`
      display: flex;
      flex-direction: row;
      margin-left: auto;
      align-items: center;
      gap: ${theme.spacing.sm};
    `,

    wrapLines: (isActive: boolean) => css`
      color: ${isActive ? theme.colors.accentColor : theme.colors.textPrimary};
      cursor: pointer;
      border: 1px solid ${isActive ? theme.colors.accentColor : theme.colors.textPrimary};
      border-radius: ${theme.spacing.xs};
    `,

    viewedCheckbox: css`
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
}

const FileViewer: React.FC<FileViewerProps> = ({ id, file }) => {
  const styles = useStyles()
  const { config } = useDiffViewerConfig()
  const [collapsed, setCollapsed] = useState(false)
  const [viewed, setViewed] = useState(false)
  const [wrapLines, setWrapLines] = useState<boolean>(config.wrapLines ?? true)
  const language = useMemo(() => detectLanguage(file.newPath), [file.newPath])
  const filePath = useMemo(
    () => (file.oldPath === file.newPath ? file.newPath : `${file.oldPath} → ${file.newPath}`),
    [file.oldPath, file.newPath],
  )

  /*
   * Pre-compute flattened line arrays for both display modes so we can directly
   * pass them to the corresponding viewer components. The expensive work is
   * memoised and will only run when the hunks or the detected language change.
   */
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
    <div id={id}>
      <div css={styles.header}>
        <ExpandButton collapsed={collapsed} size={16} onClick={handleToggleCollapse} />
        <FileActivitySummary file={file} />
        <Text className="file-path">{filePath}</Text>
        <CopyButton
          onClick={handleCopyFilePath}
          tooltip="Copy file path"
          toastText="File path copied to clipboard"
        />

        <div css={styles.rightContainer}>
          <Tooltip title={wrapLines ? 'Disable line wrap' : 'Enable line wrap'}>
            <WrapLines
              css={styles.wrapLines(wrapLines)}
              size={16}
              onClick={() => setWrapLines((prev) => !prev)}
              style={{ cursor: 'pointer' }}
            />
          </Tooltip>

          <Checkbox
            css={styles.viewedCheckbox}
            checked={viewed}
            onChange={(e) => handleToggleViewed(e.target.checked)}
          >
            Viewed
          </Checkbox>
        </div>
      </div>

      <div css={styles.body}>
        {!collapsed && config.mode === 'split' && (
          <div css={styles.hunksContainer}>
            <SplitViewer pairs={splitPairs} />
          </div>
        )}

        {!collapsed && config.mode === 'unified' && (
          <div css={styles.hunksContainer}>
            <UnifiedViewer lines={unifiedLines} />
          </div>
        )}
      </div>
    </div>
  )
}

export default FileViewer
