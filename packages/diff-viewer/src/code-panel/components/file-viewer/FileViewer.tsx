import { css } from '@emotion/react'
import { Checkbox, Typography } from 'antd'
import React, { useContext, useMemo, useState } from 'react'
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

const useStyles = (collapsed: boolean) => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.xs};
      overflow: hidden;
      flex: 0 0 auto;
    `,

    body: css`
      border: 1px solid ${theme.colors.border};
      border-top: none;
      border-bottom-left-radius: ${theme.spacing.xs};
      border-bottom-right-radius: ${theme.spacing.xs};
      overflow: hidden;
      ${collapsed && 'display: none;'}
    `,

    header: css`
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
      ${collapsed &&
      `
        border-bottom-left-radius: ${theme.spacing.xs};
        border-bottom-right-radius: ${theme.spacing.xs};
      `}

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
  }
}

const FileViewer: React.FC<FileViewerProps> = ({ id, file }) => {
  const { config, viewedFiles, collapsedFiles, setViewedFiles, setCollapsedFiles } = useCodePanelConfig()

  const fileKey = file.newPath || file.oldPath

  const collapsed = useMemo(() => {
    return collapsedFiles.includes(fileKey)
  }, [collapsedFiles, fileKey])
  const styles = useStyles(collapsed)

  const [wrapLines, setWrapLines] = useState<boolean>(true)

  const language = useMemo(() => detectLanguage(file.newPath), [file.newPath])
  const filePath = useMemo(
    () => (file.oldPath === file.newPath ? file.newPath : `${file.oldPath} → ${file.newPath}`),
    [file.oldPath, file.newPath],
  )

  const viewed = useMemo(() => {
    return viewedFiles.includes(fileKey)
  }, [viewedFiles, fileKey])

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
    setCollapsedFiles((prev: string[]) => {
      const isCollapsed = prev.includes(fileKey)
      return isCollapsed ? prev.filter((p) => p !== fileKey) : [...prev, fileKey]
    })
  }

  const handleCopyFilePath = () => {
    navigator.clipboard.writeText(filePath).catch((error) => {
      console.error(error)
    })
  }

  const handleToggleViewed = (checked: boolean) => {
    setViewedFiles((prev: string[]) => {
      const next = checked ? Array.from(new Set([...prev, fileKey])) : prev.filter((p) => p !== fileKey)
      return next
    })

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
        <CopyButton onClick={handleCopyFilePath} tooltip="Copy file path" toastText="File path copied to clipboard" />
        <WrapLinesButton isWrapped={wrapLines} onClick={() => setWrapLines((prev) => !prev)} size={16} />

        <div css={styles.rightContainer}>
          <Checkbox css={styles.viewedCheckbox} checked={viewed} onChange={(e) => handleToggleViewed(e.target.checked)}>
            Viewed
          </Checkbox>
        </div>
      </div>

      <div css={styles.body}>
        {!collapsed && config.mode === 'split' && (
          <div css={styles.hunksContainer}>
            <SplitViewer pairs={splitPairs} wrapLines={wrapLines} />
          </div>
        )}

        {!collapsed && config.mode === 'unified' && (
          <div css={styles.hunksContainer}>
            <UnifiedViewer lines={unifiedLines} wrapLines={wrapLines} />
          </div>
        )}
      </div>
    </div>
  )
}

export default FileViewer
