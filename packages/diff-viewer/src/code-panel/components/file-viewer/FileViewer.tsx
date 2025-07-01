import { css } from '@emotion/react'
import { Checkbox, Typography } from 'antd'
import React, { useContext, useMemo, useState, useCallback } from 'react'
import FileActivitySummary from '../../../shared/components/activity-summary/FileActivitySummary'
import ExpandButton from '../../../shared/components/buttons/ExpandButton'
import { detectLanguage } from '../../../shared/parsers/language-utils'
import { ThemeContext } from '../../../shared/providers/theme-context'
import { useCodePanelConfig } from '../../providers/code-panel-context'
import type { LineWithHighlight } from '../line-viewer/types'
import CopyButton from './buttons/CopyButton'
import WrapLinesButton from './buttons/LineWrapButton'
import { buildSplitHunkPairs, escapeHtml, highlightContent } from './split-utils'
import SplitViewer from './SplitViewer'
import { FileViewerProps, SplitLinePair } from './types'
import UnifiedViewer from './UnifiedViewer'

const { Text } = Typography

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return useMemo(
    () => ({
      container: css`
        display: flex;
        flex-direction: column;
        border: 1px solid ${theme.colors.border};
        border-radius: ${theme.spacing.xs};
        overflow: hidden;
        flex: 0 0 auto;
      `,

      bodyExpanded: css`
        border: 1px solid ${theme.colors.border};
        border-top: none;
        border-bottom-left-radius: ${theme.spacing.xs};
        border-bottom-right-radius: ${theme.spacing.xs};
        overflow: hidden;
      `,

      bodyCollapsed: css`
        display: none;
      `,

      headerExpanded: css`
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: ${theme.spacing.sm};
        padding: ${theme.spacing.sm};
        color: ${theme.colors.textPrimary};
        font-family: ${theme.typography.codeFontFamily};
        border: 1px solid ${theme.colors.border};
        border-bottom: 1px solid ${theme.colors.border};
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

      headerCollapsed: css`
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: ${theme.spacing.sm};
        padding: ${theme.spacing.sm};
        color: ${theme.colors.textPrimary};
        font-family: ${theme.typography.codeFontFamily};
        border: 1px solid ${theme.colors.border};
        border-bottom: 1px solid ${theme.colors.border};
        border-top-left-radius: ${theme.spacing.xs};
        border-top-right-radius: ${theme.spacing.xs};
        border-bottom-left-radius: ${theme.spacing.xs};
        border-bottom-right-radius: ${theme.spacing.xs};
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
        color: ${isActive ? theme.colors.accent : theme.colors.textPrimary};
        cursor: pointer;
      `,

      viewedCheckbox: css`
        color: ${theme.colors.textPrimary};
      `,

      hunksContainer: css`
        display: flex;
        flex-direction: column;
      `,
    }),
    [theme],
  )
}

/**
 * Utility to add or remove an item from a string list while preserving order uniqueness.
 * This is intentionally very small –‐ it avoids sprinkling the same
 * `includes/filter/concat` logic throughout the component.
 */
const toggleItem = (list: string[], item: string, shouldAdd: boolean): string[] =>
  shouldAdd ? Array.from(new Set([...list, item])) : list.filter((k) => k !== item)

/** Build the formatted lines required by the unified viewer */
const buildUnifiedLines = (file: FileViewerProps['file'], language: string): LineWithHighlight[] =>
  file.hunks.flatMap((hunk) => {
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

/** Wrapper just to mirror the unified builder – keeps both calls symmetric */
const buildSplitPairs = (file: FileViewerProps['file'], language: string): SplitLinePair[] =>
  file.hunks.flatMap((hunk) => buildSplitHunkPairs(hunk, language))

const FileViewer: React.FC<FileViewerProps> = ({ id, file }) => {
  const { config, viewedFiles, collapsedFiles, setViewedFiles, setCollapsedFiles } = useCodePanelConfig()

  const fileKey = file.newPath || file.oldPath

  /** -------------------------------------------------------------------------------------------------
   * Derived flags & memoised data
   * --------------------------------------------------------------------------------------------- */

  // Memoize collapsed state to avoid recalculating on every render
  const collapsed = useMemo(() => collapsedFiles.includes(fileKey), [collapsedFiles, fileKey])

  const styles = useStyles()

  const [wrapLines, setWrapLines] = useState<boolean>(true)

  const language = useMemo(() => detectLanguage(file.newPath), [file.newPath])

  const filePath = useMemo(
    () => (file.oldPath === file.newPath ? file.newPath : `${file.oldPath} → ${file.newPath}`),
    [file.oldPath, file.newPath],
  )

  const viewed = useMemo(() => viewedFiles.includes(fileKey), [viewedFiles, fileKey])

  // Generate a stable content key for caching based on file content
  const contentKey = useMemo(() => {
    const hunksContent = file.hunks
      .map((hunk) => `${hunk.content}:${hunk.changes.map((change) => `${change.type}:${change.content}`).join('|')}`)
      .join('@@')
    return `${fileKey}:${language}:${hunksContent.length}:${hunksContent.slice(0, 100)}`
  }, [file.hunks, fileKey, language])

  const isSplit = config.mode === 'split'
  const isUnified = config.mode === 'unified'

  /**
   * These computations can be expensive for large diffs, especially because we
   * syntax-highlight every line. We therefore only compute *exactly* what the
   * current panel mode needs AND only when not collapsed.
   */
  const unifiedLines = useMemo<LineWithHighlight[]>(
    () => (isUnified && !collapsed ? buildUnifiedLines(file, language) : []),
    [isUnified, collapsed, file, language],
  )

  const splitPairs = useMemo<SplitLinePair[]>(
    () => (isSplit && !collapsed ? buildSplitPairs(file, language) : []),
    [isSplit, collapsed, file, language],
  )

  const handleToggleCollapse = useCallback(() => {
    setCollapsedFiles((prev) => {
      const shouldAdd = !prev.includes(fileKey)
      return toggleItem(prev, fileKey, shouldAdd)
    })
  }, [fileKey, setCollapsedFiles])

  const handleCopyFilePath = useCallback(() => {
    navigator.clipboard.writeText(filePath).catch((error) => {
      console.error(error)
    })
  }, [filePath])

  const handleToggleViewed = useCallback(
    (checked: boolean) => {
      setViewedFiles((prev) => toggleItem(prev, fileKey, checked))

      if (!checked || !collapsed) {
        handleToggleCollapse()
      }
    },
    [fileKey, collapsed, setViewedFiles, handleToggleCollapse],
  )

  return (
    <div id={id}>
      <div css={collapsed ? styles.headerCollapsed : styles.headerExpanded}>
        <ExpandButton collapsed={collapsed} size={16} onClick={handleToggleCollapse} />
        <FileActivitySummary file={file} />
        <Text className="file-path">{filePath}</Text>
        <CopyButton onClick={handleCopyFilePath} tooltip="Copy file path" toastText="File path copied to clipboard" />
        <WrapLinesButton isWrapped={wrapLines} onClick={() => setWrapLines((prev) => !prev)} size={16} />

        <div css={styles.rightContainer}>
          <Checkbox css={styles.viewedCheckbox} checked={viewed} onChange={(e) => handleToggleViewed(e.target.checked)}>
            Viewed
          </Checkbox>
        </div>
      </div>

      <div css={collapsed ? styles.bodyCollapsed : styles.bodyExpanded}>
        <div css={styles.hunksContainer}>
          {isSplit && (
            <SplitViewer pairs={splitPairs} wrapLines={wrapLines} visible={!collapsed} contentKey={contentKey} />
          )}
          {isUnified && <UnifiedViewer lines={unifiedLines} wrapLines={wrapLines} visible={!collapsed} />}
        </div>
      </div>
    </div>
  )
}

export default FileViewer
