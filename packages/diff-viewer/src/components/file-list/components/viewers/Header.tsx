import { css } from '@emotion/react'
import { Checkbox, Typography } from 'antd'
import React, { useCallback, useContext, useMemo } from 'react'

import { CopyButton, ExpandButton, ThemeContext } from '@dialectica-org/commons'
import { FileDiff } from '../../../../models/FileDiff'
import { useFileState } from '../../../../providers/file-list-context'
import FileActivitySummary from '../../../activity-summary/FileActivitySummary'

const { Text } = Typography

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return useMemo(
    () => ({
      container: css`
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: ${theme.spacing.sm};
        padding: ${theme.spacing.sm};
        color: ${theme.colors.textPrimary};
        font-family: ${theme.typography.codeFontFamily};
        border: 1px solid ${theme.colors.border};
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
        border-radius: ${theme.spacing.xs};
      `,

      rightContainer: css`
        display: flex;
        flex-direction: row;
        margin-left: auto;
        align-items: center;
        gap: ${theme.spacing.sm};
      `,

      viewedCheckbox: css`
        color: ${theme.colors.textPrimary};
      `,

      binLabel: css`
        font-weight: 700;
        font-size: 0.85rem;
      `,

      deletedBinSize: css`
        color: #ff4d4f !important;
        font-weight: 600;
        font-size: 0.85rem;
      `,
    }),
    [theme],
  )
}

const Header: React.FC<{ file: FileDiff }> = ({ file }) => {
  const styles = useStyles()

  const { isCollapsed, isViewed, toggleCollapsed, toggleViewed } = useFileState(file.key)

  const handleCopyFilePath = useCallback(() => {
    navigator.clipboard.writeText(file.key).catch((error) => {
      console.error(error)
    })
  }, [file.key])

  return (
    <div css={[styles.container, isCollapsed || isViewed ? styles.headerCollapsed : styles.headerExpanded]}>
      <ExpandButton collapsed={isCollapsed} size={16} onClick={() => toggleCollapsed(!isCollapsed)} />
      {file.isBinary ? <span css={styles.binLabel}>BIN</span> : <FileActivitySummary file={file} />}

      <CopyButton onClick={handleCopyFilePath} tooltip="Copy file path" toastText="File path copied to clipboard" />

      <Text className="file-path" ellipsis={{ tooltip: file.key }} css={file.isBinary ? styles.deletedBinSize : ''}>
        {file.key}
      </Text>

      <div css={styles.rightContainer}>
        <Checkbox css={styles.viewedCheckbox} checked={isViewed} onChange={(e) => toggleViewed(e.target.checked)}>
          Viewed
        </Checkbox>
      </div>
    </div>
  )
}

export default Header
