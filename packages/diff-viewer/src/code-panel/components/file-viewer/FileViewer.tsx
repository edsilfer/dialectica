import { css } from '@emotion/react'
import { Checkbox, Typography } from 'antd'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { useContextSelector } from 'use-context-selector'
import FileActivitySummary from '../../../shared/components/activity-summary/FileActivitySummary'
import ExpandButton from '../../../shared/components/buttons/ExpandButton'
import { ThemeContext } from '../../../shared/providers/theme-context'
import { CodePanelConfigContext, useFileState } from '../../providers/code-panel-context'
import CopyButton from './buttons/CopyButton'
import WrapLinesButton from './buttons/LineWrapButton'
import { parseSplitLines, parseUnifiedLines } from './line-utils'
import SplitViewer from './SplitViewer'
import { FileViewerProps, LinePair } from './types'
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

      headerBase: css`
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
        background-color: ${theme.colors.fileViewerHeaderBg};
        position: sticky;
        top: 0;
        z-index: 5;

        .file-path {
          color: ${theme.colors.textPrimary};
        }
      `,

      headerExpanded: css`
        border-top-left-radius: ${theme.spacing.xs};
        border-top-right-radius: ${theme.spacing.xs};
      `,

      headerCollapsed: css`
        border-top-left-radius: ${theme.spacing.xs};
        border-top-right-radius: ${theme.spacing.xs};
        border-bottom-left-radius: ${theme.spacing.xs};
        border-bottom-right-radius: ${theme.spacing.xs};
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

const buildSplitLines = (file: FileViewerProps['file'], language: string): LinePair[] =>
  file.hunks.flatMap((hunk) => parseSplitLines(hunk, language))

const FileViewer: React.FC<FileViewerProps> = (props) => {
  const styles = useStyles()
  const config = useContextSelector(CodePanelConfigContext, (ctx) => {
    if (!ctx) throw new Error('FileViewer must be inside CodePanelConfigProvider')
    return ctx.config
  })
  const { isCollapsed, isViewed, toggleCollapsed, toggleViewed } = useFileState(props.file.key)

  const [wrapLines, setWrapLines] = useState<boolean>(true)

  const filePath =
    props.file.oldPath === props.file.newPath ? props.file.newPath : `${props.file.oldPath} → ${props.file.newPath}`

  const lines = useMemo<LinePair[]>(
    () =>
      config.mode === 'split' && !isCollapsed
        ? buildSplitLines(props.file, props.file.language)
        : parseUnifiedLines(props.file, props.file.language),
    [config.mode, isCollapsed, props.file],
  )

  const handleCopyFilePath = useCallback(() => {
    navigator.clipboard.writeText(filePath).catch((error) => {
      console.error(error)
    })
  }, [filePath])

  return (
    <div id={props.id}>
      <div css={[styles.headerBase, isCollapsed || isViewed ? styles.headerCollapsed : styles.headerExpanded]}>
        <ExpandButton collapsed={isCollapsed} size={16} onClick={() => toggleCollapsed(!isCollapsed)} />
        <FileActivitySummary file={props.file} />
        <Text className="file-path">{filePath}</Text>
        <CopyButton onClick={handleCopyFilePath} tooltip="Copy file path" toastText="File path copied to clipboard" />
        {config.mode === 'unified' && (
          <WrapLinesButton isWrapped={wrapLines} onClick={() => setWrapLines((prev) => !prev)} size={16} />
        )}

        <div css={styles.rightContainer}>
          <Checkbox css={styles.viewedCheckbox} checked={isViewed} onChange={(e) => toggleViewed(e.target.checked)}>
            Viewed
          </Checkbox>
        </div>
      </div>

      <div css={isCollapsed || isViewed ? styles.bodyCollapsed : styles.bodyExpanded}>
        <div css={styles.hunksContainer}>
          {config.mode === 'split' && <SplitViewer lines={lines} />}
          {config.mode === 'unified' && <UnifiedViewer lines={lines} wrapLines={wrapLines} visible={!isCollapsed} />}
        </div>
      </div>
    </div>
  )
}

export default FileViewer
