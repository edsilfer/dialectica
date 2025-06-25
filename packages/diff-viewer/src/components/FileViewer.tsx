import { CopyOutlined, DownOutlined } from '@ant-design/icons'
import { css } from '@emotion/react'
import { theme, Typography, Checkbox, Alert } from 'antd'
import React, { useMemo, useState } from 'react'
import type { FileDiff, DisplayConfig } from '../types/diff'
import UnifiedHunkViewer from './UnifiedHunkViewer'
import { detectLanguage } from '../parsers/code-utils'

const { Text } = Typography

const useStyles = () => {
  const { token } = theme.useToken()

  return {
    container: css`
      display: flex;
      flex-direction: column;
      border: 1px solid ${token.colorBorder};
      border-radius: ${token.borderRadius}px;
      background-color: ${token.colorBgContainer};
    `,
    header: css`
      display: flex;
      gap: ${token.paddingXS}px;
      padding: ${token.paddingXS}px;
      border-bottom: 1px solid ${token.colorBorder};
      background-color: #fafafa; // TODO: use theme color
    `,
    copyIcon: css`
      cursor: pointer;
      font-size: 14px;
    `,
    toggleHunk: (collapsed: boolean) => css`
      font-size: 10px;
      transform: ${collapsed ? 'rotate(-90deg)' : 'rotate(0deg)'};
      transition: transform 0.2s ease-in-out;
    `,
    viewedCheckbox: css`
      margin-left: auto;
    `,
    hunksContainer: css`
      display: flex;
      flex-direction: column;
      gap: ${token.paddingXS}px;
    `,
    alert: css`
      margin: ${token.padding}px;
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
        <Text code>
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
