import { css } from '@emotion/react'
import { Typography, Checkbox, Alert } from 'antd'
import React, { useContext, useMemo, useState } from 'react'
import type { FileDiff, DisplayConfig } from '../../types/diff'
import UnifiedHunkViewer from '../hunk/UnifiedHunkViewer'
import { detectLanguage } from '../../parsers/code-utils'
import { ThemeContext } from '../../providers/theme-provider.js'
import CopyButton from './CopyButton'
import ExpandButton from './ExpandButton'
import FileActivitySummary from './FileActivitySummary'

const { Text } = Typography

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
      border: 1px solid ${theme.colors.borderBg};
      border-radius: ${theme.spacing.xs};
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
    alert: css`
      margin: ${theme.spacing.md};
    `,
  }
}

interface FileViewerProps {
  /** The file diff object. */
  file: FileDiff
  /** The display configuration options. */
  config: DisplayConfig
}

const FileViewer: React.FC<FileViewerProps> = ({ file, config }) => {
  const styles = useStyles()
  const [collapsed, setCollapsed] = useState(false)
  const [viewed, setViewed] = useState(false)
  const language = useMemo(() => detectLanguage(file.newPath, ''), [file.newPath])
  const filePath = useMemo(
    () => (file.oldPath === file.newPath ? file.newPath : `${file.oldPath} → ${file.newPath}`),
    [file.oldPath, file.newPath],
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
    <div css={styles.container}>
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
        <Alert
          css={styles.alert}
          message="Split mode is not yet implemented"
          description="Please use unified mode to view the diff."
          type="error"
          showIcon
        />
      )}

      {!collapsed && config.mode === 'unified' && (
        <div css={styles.hunksContainer}>
          {file.hunks.map((hunk, index) => (
            <UnifiedHunkViewer key={index} hunk={hunk} config={config} language={language} />
          ))}
        </div>
      )}
    </div>
  )
}

export default FileViewer
