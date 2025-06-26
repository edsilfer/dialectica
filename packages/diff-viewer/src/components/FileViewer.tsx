import { CopyOutlined, DownOutlined } from '@ant-design/icons'
import { css } from '@emotion/react'
import { Typography, Checkbox, Alert } from 'antd'
import React, { useContext, useMemo, useState } from 'react'
import type { FileDiff, DisplayConfig } from '../types/diff'
import UnifiedHunkViewer from './UnifiedHunkViewer'
import { detectLanguage } from '../parsers/code-utils'
import { ThemeContext } from '../providers/theme-provider.js'

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
      gap: ${theme.spacing.xs};
      align-items: center;
      padding: ${theme.spacing.xs};
      color: ${theme.colors.textPrimary};
      font-family: ${theme.typography.codeFontFamily};
      border-bottom: 1px solid ${theme.colors.borderBg};
      background-color: ${theme.colors.fileViewerHeaderBg};

      .file-path {
        color: ${theme.colors.textPrimary};
      }
    `,
    copyIcon: css`
      cursor: pointer;
      font-size: 14px;
      color: ${theme.colors.textPrimary};
    `,
    toggleHunk: (collapsed: boolean) => css`
      font-size: 10px;
      color: ${theme.colors.textPrimary};
      transform: ${collapsed ? 'rotate(-90deg)' : 'rotate(0deg)'};
      transition: transform 0.2s ease-in-out;
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

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed)
  }

  const handleCopyFilePath = () => {
    const isRenamed = file.oldPath !== file.newPath
    const filePath = isRenamed ? `${file.oldPath} → ${file.newPath}` : file.newPath
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
        <DownOutlined css={styles.toggleHunk(collapsed)} onClick={handleToggleCollapse} />
        <Text className="file-path">
          {file.oldPath === file.newPath ? file.newPath : `${file.oldPath} → ${file.newPath}`}
        </Text>
        <CopyOutlined css={styles.copyIcon} onClick={handleCopyFilePath} />
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
