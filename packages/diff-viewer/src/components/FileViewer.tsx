import { DownOutlined } from '@ant-design/icons'
import { css } from '@emotion/react'
import { theme, Typography, Checkbox } from 'antd'
import React, { useState } from 'react'
import type { FileDiff } from '../types/diff'

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
      gap: ${token.paddingSM}px;
      padding: ${token.paddingXS}px;
      border-bottom: 1px solid ${token.colorBorder};
    `,
    chevron: (collapsed: boolean) => css`
      font-size: 12px;
      transform: ${collapsed ? 'rotate(-90deg)' : 'rotate(0deg)'};
      transition: transform 0.2s ease-in-out;
    `,
    viewedCheckbox: css`
      margin-left: auto;
    `,
  }
}

interface FileViewerProps {
  /** The file diff object. */
  file: FileDiff
}

const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
  const styles = useStyles()
  const [collapsed, setCollapsed] = useState(false)
  const [viewed, setViewed] = useState(false)

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed)
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
        <DownOutlined css={styles.chevron(collapsed)} onClick={handleToggleCollapse} />
        <Text>
          {file.oldPath === file.newPath ? file.newPath : `${file.oldPath} → ${file.newPath}`}
        </Text>
        <Checkbox
          css={styles.viewedCheckbox}
          checked={viewed}
          onChange={(e) => handleToggleViewed(e.target.checked)}
        >
          Viewed
        </Checkbox>
      </div>
      {!collapsed && <pre>{file.hunks.map((hunk) => hunk.content).join('\n')}</pre>}
    </div>
  )
}

export default FileViewer
